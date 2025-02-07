function validateInput(data, rules) {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
        const fieldRules = rules[field].split('|');
        
        fieldRules.forEach(rule => {
            if (rule === 'required' && !data[field]) {
                errors[field] = `${field} is required`;
                isValid = false;
            }
            
            if (rule === 'numeric' && isNaN(data[field])) {
                errors[field] = `${field} must be numeric`;
                isValid = false;
            }
            
            if (rule.startsWith('min:')) {
                const minValue = parseInt(rule.split(':')[1]);
                if (data[field] < minValue) {
                    errors[field] = `${field} must be at least ${minValue}`;
                    isValid = false;
                }
            }
        });
    });

    return { isValid, errors };
}

module.exports = { validateInput };
