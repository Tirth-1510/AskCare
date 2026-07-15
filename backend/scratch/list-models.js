const url = 'https://router.huggingface.co/v1/models';
const token = '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';

fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  const ids = data.data.map(m => m.id);
  console.log('Total models:', ids.length);
  const filtered = ids.filter(id => 
    id.toLowerCase().includes('smol') || 
    id.toLowerCase().includes('llama') || 
    id.toLowerCase().includes('qwen') || 
    id.toLowerCase().includes('gemma') ||
    id.toLowerCase().includes('mistral')
  );
  console.log('Supported open models in HF router:', filtered);
})
.catch(err => console.error(err));
