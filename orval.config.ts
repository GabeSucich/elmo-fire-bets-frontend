// orval.config.ts
export default {
  myApi: {
    input: 'http://localhost:8000/openapi.json', // or path to your spec
    output: {
      target: './api/generated.ts',
      client: 'react-query',  // <-- this is the key setting
    },
  },
};