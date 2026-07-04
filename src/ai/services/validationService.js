// Validates structured JSON responses from AI against basic schema requirements

export const validationService = {
  validate: (data, schema = {}) => {
    if (!data) {
      throw new Error("Validation failed: Received null or undefined data.");
    }

    // Required fields check
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Validation failed: Missing required field "${field}".`);
        }
      }
    }

    // Type checking
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          const expectedType = schema.properties[key].type;
          const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
          
          if (expectedType && expectedType !== actualType) {
            console.warn(`Validation Warning: Field "${key}" expected type "${expectedType}" but got "${actualType}".`);
          }
        }
      });
    }

    return true;
  }
};
