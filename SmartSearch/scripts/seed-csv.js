const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const esClient = require('../config/elasticsearch');

const INDEX_NAME = 'speech_data';
const FILES_TO_LOAD = ['600K US Housing Properties.csv'];

async function seedCsvDatabase() {
  console.log(`🌱 Reading massive CSV files via stream: ${FILES_TO_LOAD.join(', ')}...`);

  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (indexExists) {
      console.log(`Deleting old index "${INDEX_NAME}"...`);
      await esClient.indices.delete({ index: INDEX_NAME });
    }

    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            keywordId: { type: 'keyword' }, 
            title: { type: 'text' },        
            content: { type: 'text' },
            property_id: { type: 'keyword' }
          }
        }
      }
    });

    console.log('Starting bulk insert stream... (Processing chunks on the fly to prevent OOM errors!)');

    const CHUNK_SIZE = 5000; 
    let chunk = [];
    let totalProcessed = 0;
    
    for (const file of FILES_TO_LOAD) {
        console.log(`Loading stream from ${file}...`);
        const filePath = path.join(__dirname, '../data', file);
        const stream = fs.createReadStream(filePath).pipe(csv());
        
        for await (const row of stream) {
            totalProcessed++;
            
            // --- AUTOMATIC CSV PARSING ---
            // Dynamically get all column headers from the row
            const keys = Object.keys(row);
            if (keys.length === 0) continue;

            // Intelligently find a column to use as the title (looks for 'address', 'title', 'name', or defaults to the first column)
            const titleKey = keys.find(k => /address|title|name/i.test(k)) || keys[0];
            const searchTitle = row[titleKey] ? String(row[titleKey]) : 'Unknown Item';
            
            if (!searchTitle || searchTitle === 'Unknown Item') continue;

            // Try to find a unique ID column, otherwise generate a random one
            const idKey = keys.find(k => /id/i.test(k) && !/keyword/i.test(k));
            const propertyId = idKey && row[idKey] ? row[idKey] : Math.random().toString(36).substring(2, 10);

            // Dynamically build HTML content using all available columns
            let tableHtml = `<div style="background:#f8f9fa; padding:15px; border-radius:8px;">`;
            tableHtml += `<h4>${searchTitle}</h4>`;
            tableHtml += `<strong>ID:</strong> ${propertyId}<br>`;
            
            keys.forEach(k => {
                // Skip title/id as they are already displayed, and skip empty values
                if (k !== titleKey && k !== idKey && row[k]) {
                    // Automatically convert links to clickable anchor tags
                    if (/^http/i.test(row[k])) {
                        tableHtml += `<p><a href="${row[k]}" target="_blank">View ${k.replace(/_/g, ' ')}</a></p>`;
                    } else {
                        tableHtml += `<strong>${k.replace(/_/g, ' ').toUpperCase()}:</strong> ${row[k]}<br>`;
                    }
                }
            });
            tableHtml += `</div>`;

            chunk.push({ index: { _index: INDEX_NAME } });
            chunk.push({
                keywordId: searchTitle.toLowerCase(),
                title: searchTitle,
                content: tableHtml,
                property_id: propertyId
            });

            // Once we hit CHUNK_SIZE documents (2 items per doc in bulk array = CHUNK_SIZE * 2)
            if (chunk.length >= CHUNK_SIZE * 2) {
                 try {
                     const { body: bulkResponse } = await esClient.bulk({ refresh: false, body: chunk });
                     if (bulkResponse && bulkResponse.errors) {
                        console.error('❌ Errors occurred during bulk inserting a chunk.');
                     }
                 } catch (e) {
                     console.error('Chunk insertion failed:', e.message);
                 }
                 chunk = []; // Free up memory immediately after processing
                 process.stdout.write(`\rProcessed ${totalProcessed} records...`);
            }
        }
    }

    // Insert any final stragglers left in the array (and force refresh so they are immediately searchable)
    if (chunk.length > 0) {
        await esClient.bulk({ refresh: true, body: chunk });
        process.stdout.write(`\rProcessed ${totalProcessed} records...`);
    }

    console.log(`\n✅ Successfully seeded dataset into Elasticsearch!`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedCsvDatabase();
