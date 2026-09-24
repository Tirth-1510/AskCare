/**
 * models.config.js — Clinical AI Model Catalog & Registry
 *
 * Defines the models available for selection in AskCare.
 * Provides metadata including speed, context window, provider, and clinical capabilities.
 */

const AVAILABLE_MODELS = [
  {
    id: 'open-mistral-7b',
    name: 'Mistral 7B Instruct',
    provider: 'Mistral AI',
    tag: 'Fast & Production Grade',
    badge: 'Recommended',
    speed: 'Ultra Fast',
    contextWindow: '32k',
    isDefault: true,
    description: 'Production-grade 7.3B parameter model optimized for rapid, structured clinical reasoning, low latency, and strict safety guidelines.',
    icon: 'Zap'
  },
  {
    id: 'ministral-8b-latest',
    name: 'Ministral 8B',
    provider: 'Mistral AI',
    tag: 'Edge Precision',
    badge: 'High Accuracy',
    speed: 'Very Fast',
    contextWindow: '128k',
    isDefault: false,
    description: 'State-of-the-art 8B edge model with extended 128k context and superior multi-turn instruction following.',
    icon: 'Cpu'
  },
  {
    id: 'mistral-small-2603',
    name: 'Mistral Small 4',
    provider: 'Mistral AI',
    tag: 'Deep Reasoning',
    badge: '119B MoE',
    speed: 'Balanced',
    contextWindow: '32k',
    isDefault: false,
    description: 'Heavyweight 119B Mixture-of-Experts architecture tailored for complex multi-symptom differential consultations.',
    icon: 'Brain'
  },
  {
    id: 'askcare-medical',
    name: 'AskCare SmolLM2 Medical',
    provider: 'AskCare SLM',
    tag: 'Specialized SLM',
    badge: 'Privacy First',
    speed: 'Fast',
    contextWindow: '8k',
    isDefault: false,
    description: 'Fine-tuned compact clinical assistant for high-privacy, local, or specialized healthcare triage queries.',
    icon: 'ShieldCheck'
  }
];

const DEFAULT_MODEL_ID = process.env.MISTRAL_MODEL_NAME || 'open-mistral-7b';

/**
 * findModelById — Helper to retrieve model metadata by identifier.
 * @param {string} modelId
 * @returns {Object}
 */
const findModelById = (modelId) => {
  if (!modelId) return AVAILABLE_MODELS[0];
  const found = AVAILABLE_MODELS.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  return found || AVAILABLE_MODELS[0];
};

module.exports = {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  findModelById
};
