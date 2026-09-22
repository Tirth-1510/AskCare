// backend/prepare_dataset.js
const fs = require('fs');
const path = require('path');

// Define your medical Q&A training pairs
const medicalTrainingData = [
    {
        messages: [
            { role: "system", content: "You are a clinical query resolution assistant for AskCare. Provide concise, evidence-based medical advice." },
            { role: "user", content: "What are the common symptoms of high blood pressure?" },
            { role: "assistant", content: "High blood pressure (hypertension) often has no symptoms ('silent killer'). When severe, symptoms can include headaches, shortness of breath, dizziness, and nosebleeds. Regular blood pressure screening is essential." }
        ]
    },
    {
        messages: [
            { role: "system", content: "You are a clinical query resolution assistant for AskCare. Provide concise, evidence-based medical advice." },
            { role: "user", content: "How should acute fever be managed at home?" },
            { role: "assistant", content: "Stay hydrated, rest, and use over-the-counter antipyretics such as paracetamol or ibuprofen following recommended dosages. Seek emergency care if the temperature exceeds 103°F (39.4°C) or lasts over 3 days." }
        ]
    },
    {
        messages: [
            { role: "system", content: "You are a clinical query resolution assistant for AskCare. Provide concise, evidence-based medical advice." },
            { role: "user", content: "Can I take paracetamol with antibiotics?" },
            { role: "assistant", content: "In most cases, paracetamol can safely be taken alongside common antibiotics like amoxicillin to reduce pain and fever. Always check with your pharmacist for specific drug interactions." }
        ]
    }
    // Add more medical conversation objects here (aim for 200+ pairs)
];

// Export to JSONL format
const outputPath = path.join(__dirname, 'medical_dataset.jsonl');
const jsonlContent = medicalTrainingData.map(item => JSON.stringify(item)).join('\n');

fs.writeFileSync(outputPath, jsonlContent, 'utf-8');
console.log(`✅ Training dataset generated: ${outputPath} (${medicalTrainingData.length} records)`);
