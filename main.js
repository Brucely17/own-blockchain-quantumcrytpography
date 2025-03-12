const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

async function downloadAndProcessCSV(url) {
    try {
        // Fetch the CSV file
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        // Create a writable stream to save the CSV data
        const writableStream = fs.createWriteStream('temp.csv');

        // Pipe the response body to the writable stream
        await pipeline(response.body, writableStream);

        console.log('CSV file downloaded successfully.');

        // Read and process the CSV file
        const results = [];
        fs.createReadStream('temp.csv')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log('CSV data processed successfully.');
                console.log(results); // Output the parsed CSV data
                // You can now work with the `results` array
            });

    } catch (error) {
        console.error('Error downloading or processing the CSV file:', error);
    }
}

// Replace with your IPFS link
const ipfsLink = 'https://gateway.pinata.cloud/ipfs/QmQsAaVbeQSnZk26iTTQ85JyRNJ16Es1rSeiRXxNASs2pX';

downloadAndProcessCSV(ipfsLink);