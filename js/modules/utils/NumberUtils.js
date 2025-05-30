// Módulo de utilidades para números
export class NumberUtils {
    // Parsear número
    static parseNumber(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        
        // Eliminar caracteres no numéricos excepto punto y coma
        const cleanValue = value.toString().replace(/[^\d.,]/g, '');
        
        // Convertir a número
        const number = parseFloat(cleanValue.replace(',', '.'));
        return isNaN(number) ? 0 : number;
    }

    // Formatear número
    static formatNumber(number, decimals = 2) {
        if (!number && number !== 0) return '';
        return Number(number).toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Formatear moneda
    static formatCurrency(number, currency = 'PEN') {
        if (!number && number !== 0) return '';
        return Number(number).toLocaleString('es-ES', {
            style: 'currency',
            currency: currency
        });
    }

    // Calcular IGV
    static calculateIGV(amount) {
        return this.round(amount * 0.18, 2);
    }

    // Calcular monto con IGV
    static calculateWithIGV(amount) {
        return this.round(amount * 1.18, 2);
    }

    // Calcular monto sin IGV
    static calculateWithoutIGV(amount) {
        return this.round(amount / 1.18, 2);
    }

    // Redondear número
    static round(number, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }

    // Truncar número
    static truncate(number, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.trunc(number * factor) / factor;
    }

    // Calcular porcentaje
    static calculatePercentage(value, total) {
        if (!total) return 0;
        return this.round((value / total) * 100, 2);
    }

    // Calcular valor de porcentaje
    static calculateValueFromPercentage(percentage, total) {
        return this.round((percentage / 100) * total, 2);
    }

    // Verificar si es número
    static isNumber(value) {
        if (typeof value === 'number') return !isNaN(value);
        if (typeof value !== 'string') return false;
        return !isNaN(this.parseNumber(value));
    }

    // Obtener número mínimo
    static min(...numbers) {
        return Math.min(...numbers.map(n => this.parseNumber(n)));
    }

    // Obtener número máximo
    static max(...numbers) {
        return Math.max(...numbers.map(n => this.parseNumber(n)));
    }

    // Calcular promedio
    static average(...numbers) {
        const validNumbers = numbers.map(n => this.parseNumber(n));
        const sum = validNumbers.reduce((a, b) => a + b, 0);
        return this.round(sum / validNumbers.length, 2);
    }

    // Calcular suma
    static sum(...numbers) {
        return this.round(numbers.reduce((a, b) => a + this.parseNumber(b), 0), 2);
    }

    // Calcular diferencia
    static difference(a, b) {
        return this.round(this.parseNumber(a) - this.parseNumber(b), 2);
    }

    // Calcular producto
    static multiply(...numbers) {
        return this.round(numbers.reduce((a, b) => a * this.parseNumber(b), 1), 2);
    }

    // Calcular cociente
    static divide(a, b) {
        const divisor = this.parseNumber(b);
        if (divisor === 0) return 0;
        return this.round(this.parseNumber(a) / divisor, 2);
    }

    // Verificar si es par
    static isEven(number) {
        return this.parseNumber(number) % 2 === 0;
    }

    // Verificar si es impar
    static isOdd(number) {
        return this.parseNumber(number) % 2 !== 0;
    }

    // Verificar si es positivo
    static isPositive(number) {
        return this.parseNumber(number) > 0;
    }

    // Verificar si es negativo
    static isNegative(number) {
        return this.parseNumber(number) < 0;
    }

    // Verificar si es cero
    static isZero(number) {
        return this.parseNumber(number) === 0;
    }

    // Obtener valor absoluto
    static abs(number) {
        return Math.abs(this.parseNumber(number));
    }

    // Obtener valor entero
    static floor(number) {
        return Math.floor(this.parseNumber(number));
    }

    // Obtener valor entero superior
    static ceil(number) {
        return Math.ceil(this.parseNumber(number));
    }
} 