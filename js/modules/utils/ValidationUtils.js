/**
 * ValidationUtils - Módulo para validaciones del sistema
 */
export class ValidationUtils {
    static validateDates(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Las fechas son requeridas');
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Formato de fecha inválido');
        }

        if (start > end) {
            throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
        }

        return true;
    }

    static validateAmount(amount, maxAmount = null) {
        if (amount === null || amount === undefined) {
            throw new Error('El monto es requerido');
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            throw new Error('El monto debe ser un número válido');
        }

        if (numAmount < 0) {
            throw new Error('El monto no puede ser negativo');
        }

        if (maxAmount !== null && numAmount > maxAmount) {
            throw new Error(`El monto no puede exceder ${maxAmount}`);
        }

        return true;
    }

    static validateHESQuantities(quantities, availableQuantities) {
        if (!quantities || !availableQuantities) {
            throw new Error('Las cantidades son requeridas');
        }

        for (const [key, value] of Object.entries(quantities)) {
            const available = availableQuantities[key];
            if (value > available) {
                throw new Error(`La cantidad para ${key} excede la disponible (${available})`);
            }
        }

        return true;
    }

    static validateFileType(file, allowedTypes) {
        if (!file) {
            throw new Error('El archivo es requerido');
        }

        const fileType = file.type;
        if (!allowedTypes.includes(fileType)) {
            throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
        }

        return true;
    }

    static validateFileSize(file, maxSizeMB) {
        if (!file) {
            throw new Error('El archivo es requerido');
        }

        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new Error(`El archivo excede el tamaño máximo permitido (${maxSizeMB}MB)`);
        }

        return true;
    }

    static validateRequiredFields(data, requiredFields) {
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`El campo ${field} es requerido`);
            }
        }

        return true;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('El formato del correo electrónico no es válido');
        }

        return true;
    }

    static validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('El formato del teléfono no es válido');
        }

        return true;
    }

    static validateNumericRange(value, min, max) {
        const num = Number(value);
        if (isNaN(num)) {
            throw new Error('El valor debe ser un número');
        }

        if (num < min || num > max) {
            throw new Error(`El valor debe estar entre ${min} y ${max}`);
        }

        return true;
    }

    static validateDateFormat(date, format = 'YYYY-MM-DD') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error('El formato de fecha debe ser YYYY-MM-DD');
        }

        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        if (dateObj.getFullYear() !== year || 
            dateObj.getMonth() !== month - 1 || 
            dateObj.getDate() !== day) {
            throw new Error('La fecha no es válida');
        }

        return true;
    }

    // Validar email
    static isValidEmail(email) {
        try {
            if (!email) {
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        } catch (error) {
            console.error('Error al validar email:', error);
            return false;
        }
    }

    // Validar RUC
    static isValidRUC(ruc) {
        try {
            if (!ruc) {
                return false;
            }

            // Validar longitud
            if (ruc.length !== 11) {
                return false;
            }

            // Validar que sean números
            if (!/^\d+$/.test(ruc)) {
                return false;
            }

            // Validar dígito verificador
            const digito = parseInt(ruc.charAt(10));
            const suma = ruc.substring(0, 10).split('').reduce((acc, val, idx) => {
                const factor = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2][idx];
                return acc + (parseInt(val) * factor);
            }, 0);
            const residuo = suma % 11;
            const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

            return digito === digitoVerificador;
        } catch (error) {
            console.error('Error al validar RUC:', error);
            return false;
        }
    }

    // Validar DNI
    static isValidDNI(dni) {
        try {
            if (!dni) {
                return false;
            }

            // Validar longitud
            if (dni.length !== 8) {
                return false;
            }

            // Validar que sean números
            if (!/^\d+$/.test(dni)) {
                return false;
            }

            // Validar dígito verificador
            const digito = parseInt(dni.charAt(7));
            const suma = dni.substring(0, 7).split('').reduce((acc, val, idx) => {
                const factor = [3, 2, 7, 6, 5, 4, 3][idx];
                return acc + (parseInt(val) * factor);
            }, 0);
            const residuo = suma % 11;
            const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

            return digito === digitoVerificador;
        } catch (error) {
            console.error('Error al validar DNI:', error);
            return false;
        }
    }

    // Validar teléfono
    static isValidPhone(phone) {
        try {
            if (!phone) {
                return false;
            }

            // Validar formato
            const phoneRegex = /^(\+51|51)?[9]\d{8}$/;
            return phoneRegex.test(phone);
        } catch (error) {
            console.error('Error al validar teléfono:', error);
            return false;
        }
    }

    // Validar fecha
    static isValidDate(date) {
        try {
            if (!date) {
                return false;
            }

            const dateObj = new Date(date);
            return dateObj instanceof Date && !isNaN(dateObj);
        } catch (error) {
            console.error('Error al validar fecha:', error);
            return false;
        }
    }

    // Validar número
    static isValidNumber(number) {
        try {
            if (number === null || number === undefined) {
                return false;
            }

            return !isNaN(number) && isFinite(number);
        } catch (error) {
            console.error('Error al validar número:', error);
            return false;
        }
    }

    // Validar texto
    static isValidText(text, minLength = 0, maxLength = Infinity) {
        try {
            if (text === null || text === undefined) {
                return false;
            }

            const length = text.toString().trim().length;
            return length >= minLength && length <= maxLength;
        } catch (error) {
            console.error('Error al validar texto:', error);
            return false;
        }
    }

    // Validar URL
    static isValidURL(url) {
        try {
            if (!url) {
                return false;
            }

            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            return urlRegex.test(url);
        } catch (error) {
            console.error('Error al validar URL:', error);
            return false;
        }
    }

    // Validar contraseña
    static isValidPassword(password, minLength = 8) {
        try {
            if (!password) {
                return false;
            }

            // Validar longitud
            if (password.length < minLength) {
                return false;
            }

            // Validar mayúsculas
            if (!/[A-Z]/.test(password)) {
                return false;
            }

            // Validar minúsculas
            if (!/[a-z]/.test(password)) {
                return false;
            }

            // Validar números
            if (!/\d/.test(password)) {
                return false;
            }

            // Validar caracteres especiales
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar contraseña:', error);
            return false;
        }
    }

    // Validar archivo
    static isValidFile(file, maxSize = 5 * 1024 * 1024, allowedTypes = []) {
        try {
            if (!file) {
                return false;
            }

            // Validar tamaño
            if (file.size > maxSize) {
                return false;
            }

            // Validar tipo
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar archivo:', error);
            return false;
        }
    }

    // Validar imagen
    static isValidImage(file, maxSize = 5 * 1024 * 1024, maxWidth = 1920, maxHeight = 1080) {
        try {
            if (!file) {
                return false;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                return false;
            }

            // Validar tamaño
            if (file.size > maxSize) {
                return false;
            }

            // Validar dimensiones
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    resolve(img.width <= maxWidth && img.height <= maxHeight);
                };
                img.onerror = () => {
                    resolve(false);
                };
                img.src = URL.createObjectURL(file);
            });
        } catch (error) {
            console.error('Error al validar imagen:', error);
            return false;
        }
    }

    // Validar documento
    static isValidDocument(file, maxSize = 10 * 1024 * 1024) {
        try {
            if (!file) {
                return false;
            }

            // Validar tipo
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];

            if (!allowedTypes.includes(file.type)) {
                return false;
            }

            // Validar tamaño
            if (file.size > maxSize) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar documento:', error);
            return false;
        }
    }

    // Validar dirección
    static isValidAddress(address) {
        try {
            if (!address) {
                return false;
            }

            // Validar longitud mínima
            if (address.length < 5) {
                return false;
            }

            // Validar caracteres especiales
            if (/[<>{}]/.test(address)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar dirección:', error);
            return false;
        }
    }

    // Validar código postal
    static isValidPostalCode(code) {
        try {
            if (!code) {
                return false;
            }

            // Validar formato peruano
            const postalCodeRegex = /^\d{5}$/;
            return postalCodeRegex.test(code);
        } catch (error) {
            console.error('Error al validar código postal:', error);
            return false;
        }
    }

    // Validar coordenadas
    static isValidCoordinates(lat, lng) {
        try {
            if (!lat || !lng) {
                return false;
            }

            // Validar latitud (-90 a 90)
            if (lat < -90 || lat > 90) {
                return false;
            }

            // Validar longitud (-180 a 180)
            if (lng < -180 || lng > 180) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar coordenadas:', error);
            return false;
        }
    }

    // Validar moneda
    static isValidCurrency(amount) {
        try {
            if (amount === null || amount === undefined) {
                return false;
            }

            // Validar que sea número
            if (!this.isValidNumber(amount)) {
                return false;
            }

            // Validar que sea positivo
            if (amount < 0) {
                return false;
            }

            // Validar decimales
            const decimalPlaces = amount.toString().split('.')[1];
            if (decimalPlaces && decimalPlaces.length > 2) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar moneda:', error);
            return false;
        }
    }

    // Validar porcentaje
    static isValidPercentage(value) {
        try {
            if (value === null || value === undefined) {
                return false;
            }

            // Validar que sea número
            if (!this.isValidNumber(value)) {
                return false;
            }

            // Validar rango (0 a 100)
            if (value < 0 || value > 100) {
                throw new Error('El porcentaje debe estar entre 0% y 100%');
            }

            return true;
        } catch (error) {
            console.error('Error al validar porcentaje:', error);
            return false;
        }
    }

    // Validar hora
    static isValidTime(time) {
        try {
            if (!time) {
                return false;
            }

            // Validar formato (HH:mm)
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(time);
        } catch (error) {
            console.error('Error al validar hora:', error);
            return false;
        }
    }

    // Validar código
    static isValidCode(code, pattern) {
        try {
            if (!code) {
                return false;
            }

            // Validar patrón
            const codeRegex = new RegExp(pattern);
            return codeRegex.test(code);
        } catch (error) {
            console.error('Error al validar código:', error);
            return false;
        }
    }

    // Validar lista
    static isValidList(list, minLength = 0, maxLength = Infinity) {
        try {
            if (!Array.isArray(list)) {
                return false;
            }

            return list.length >= minLength && list.length <= maxLength;
        } catch (error) {
            console.error('Error al validar lista:', error);
            return false;
        }
    }

    // Validar objeto
    static isValidObject(obj, requiredFields = []) {
        try {
            if (!obj || typeof obj !== 'object') {
                return false;
            }

            // Validar campos requeridos
            for (const field of requiredFields) {
                if (!(field in obj)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error al validar objeto:', error);
            return false;
        }
    }

    // Validar JSON
    static isValidJSON(json) {
        try {
            if (!json) {
                return false;
            }

            JSON.parse(json);
            return true;
        } catch (error) {
            console.error('Error al validar JSON:', error);
            return false;
        }
    }

    // Validar base64
    static isValidBase64(base64) {
        try {
            if (!base64) {
                return false;
            }

            // Validar formato
            const base64Regex = /^data:image\/[a-z]+;base64,/;
            if (!base64Regex.test(base64)) {
                return false;
            }

            // Validar contenido
            const content = base64.split(',')[1];
            if (!content) {
                return false;
            }

            // Intentar decodificar
            atob(content);
            return true;
        } catch (error) {
            console.error('Error al validar base64:', error);
            return false;
        }
    }

    // Validar color
    static isValidColor(color) {
        try {
            if (!color) {
                return false;
            }

            // Validar formato hexadecimal
            const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (hexRegex.test(color)) {
                return true;
            }

            // Validar formato RGB
            const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
            if (rgbRegex.test(color)) {
                const values = color.match(/\d+/g);
                return values.every(value => parseInt(value) >= 0 && parseInt(value) <= 255);
            }

            // Validar formato RGBA
            const rgbaRegex = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([01]|0?\.\d+)\)$/;
            if (rgbaRegex.test(color)) {
                const values = color.match(/\d+/g);
                return values.slice(0, 3).every(value => parseInt(value) >= 0 && parseInt(value) <= 255);
            }

            return false;
        } catch (error) {
            console.error('Error al validar color:', error);
            return false;
        }
    }

    // Validar IP
    static isValidIP(ip) {
        try {
            if (!ip) {
                return false;
            }

            // Validar formato IPv4
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (ipv4Regex.test(ip)) {
                const parts = ip.split('.');
                return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
            }

            // Validar formato IPv6
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            return ipv6Regex.test(ip);
        } catch (error) {
            console.error('Error al validar IP:', error);
            return false;
        }
    }

    // Validar MAC
    static isValidMAC(mac) {
        try {
            if (!mac) {
                return false;
            }

            // Validar formato
            const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
            return macRegex.test(mac);
        } catch (error) {
            console.error('Error al validar MAC:', error);
            return false;
        }
    }

    // Validar UUID
    static isValidUUID(uuid) {
        try {
            if (!uuid) {
                return false;
            }

            // Validar formato
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(uuid);
        } catch (error) {
            console.error('Error al validar UUID:', error);
            return false;
        }
    }

    // Validar ISBN
    static isValidISBN(isbn) {
        try {
            if (!isbn) {
                return false;
            }

            // Eliminar guiones y espacios
            isbn = isbn.replace(/[-\s]/g, '');

            // Validar longitud
            if (isbn.length !== 10 && isbn.length !== 13) {
                return false;
            }

            // Validar ISBN-10
            if (isbn.length === 10) {
                let sum = 0;
                for (let i = 0; i < 9; i++) {
                    sum += parseInt(isbn[i]) * (10 - i);
                }
                const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
                return (sum + checkDigit) % 11 === 0;
            }

            // Validar ISBN-13
            if (isbn.length === 13) {
                let sum = 0;
                for (let i = 0; i < 12; i++) {
                    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
                }
                const checkDigit = parseInt(isbn[12]);
                return (10 - (sum % 10)) % 10 === checkDigit;
            }

            return false;
        } catch (error) {
            console.error('Error al validar ISBN:', error);
            return false;
        }
    }

    // Validar tarjeta de crédito
    static isValidCreditCard(card) {
        try {
            if (!card) {
                return false;
            }

            // Eliminar espacios y guiones
            card = card.replace(/[-\s]/g, '');

            // Validar que sean números
            if (!/^\d+$/.test(card)) {
                return false;
            }

            // Validar longitud
            if (card.length < 13 || card.length > 19) {
                return false;
            }

            // Algoritmo de Luhn
            let sum = 0;
            let isEven = false;

            for (let i = card.length - 1; i >= 0; i--) {
                let digit = parseInt(card[i]);

                if (isEven) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }

                sum += digit;
                isEven = !isEven;
            }

            return sum % 10 === 0;
        } catch (error) {
            console.error('Error al validar tarjeta de crédito:', error);
            return false;
        }
    }

    // Validar CVV
    static isValidCVV(cvv) {
        try {
            if (!cvv) {
                return false;
            }

            // Validar que sean números
            if (!/^\d+$/.test(cvv)) {
                return false;
            }

            // Validar longitud
            return cvv.length === 3 || cvv.length === 4;
        } catch (error) {
            console.error('Error al validar CVV:', error);
            return false;
        }
    }

    // Validar fecha de expiración
    static isValidExpirationDate(month, year) {
        try {
            if (!month || !year) {
                return false;
            }

            // Validar que sean números
            if (!this.isValidNumber(month) || !this.isValidNumber(year)) {
                return false;
            }

            // Validar mes
            if (month < 1 || month > 12) {
                return false;
            }

            // Validar año
            const currentYear = new Date().getFullYear();
            if (year < currentYear || year > currentYear + 10) {
                return false;
            }

            // Validar si está expirado
            const currentMonth = new Date().getMonth() + 1;
            if (year === currentYear && month < currentMonth) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al validar fecha de expiración:', error);
            return false;
        }
    }

    static validateCrossDates(contractDates, hesDates) {
        try {
            const contractStart = new Date(contractDates.start);
            const contractEnd = new Date(contractDates.end);
            const hesStart = new Date(hesDates.start);
            const hesEnd = new Date(hesDates.end);

            if (hesStart < contractStart || hesEnd > contractEnd) {
                throw new Error('Las fechas de la HES deben estar dentro del rango del contrato');
            }

            return true;
        } catch (error) {
            throw new Error(`Error en validación de fechas cruzadas: ${error.message}`);
        }
    }

    static validateAccumulatedAmounts(contractAmount, hesAmounts) {
        try {
            const totalHESAmount = hesAmounts.reduce((sum, amount) => sum + amount, 0);
            if (totalHESAmount > contractAmount) {
                throw new Error('El monto total de las HES excede el monto del contrato');
            }
            return true;
        } catch (error) {
            throw new Error(`Error en validación de montos acumulados: ${error.message}`);
        }
    }

    static validateFileMetadata(file, maxSizeMB = 10) {
        try {
            if (!file) {
                throw new Error('El archivo es requerido');
            }

            // Validar tamaño
            if (file.size > maxSizeMB * 1024 * 1024) {
                throw new Error(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
            }

            // Validar tipo
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Tipo de archivo no permitido');
            }

            // Validar nombre
            if (file.name.length > 100) {
                throw new Error('El nombre del archivo es demasiado largo');
            }

            return true;
        } catch (error) {
            throw new Error(`Error en validación de archivo: ${error.message}`);
        }
    }

    static async validateSicacNumber(numeroSicac, currentContractId = null) {
        try {
            if (!numeroSicac) {
                throw new Error('El número SICAC es requerido');
            }

            // Buscar contratos con el mismo número SICAC
            const existingContracts = await db.contracts
                .where('numeroSicac')
                .equals(numeroSicac)
                .toArray();

            // Si estamos editando un contrato existente, excluirlo de la validación
            const duplicateContracts = currentContractId 
                ? existingContracts.filter(c => c.id !== currentContractId)
                : existingContracts;

            if (duplicateContracts.length > 0) {
                const duplicateContract = duplicateContracts[0];
                throw new Error(
                    `Ya existe un contrato con el número SICAC ${numeroSicac}. ` +
                    `Contrato existente: ${duplicateContract.numeroProveedor || 'Sin número de proveedor'}. ` +
                    `Por favor, modifique el número SICAC o edite el contrato existente.`
                );
            }

            return true;
        } catch (error) {
            throw new Error(`Error en validación de número SICAC: ${error.message}`);
        }
    }

    static validateProgressPercentage(value, type) {
        try {
            if (value === null || value === undefined) {
                return false;
            }

            // Validar que sea número
            if (!this.isValidNumber(value)) {
                return false;
            }

            // Validar rango (0 a 100)
            if (value < 0 || value > 100) {
                throw new Error(`El avance ${type} no puede ser menor a 0% ni mayor a 100%`);
            }

            return true;
        } catch (error) {
            throw new Error(`Error en validación de porcentaje: ${error.message}`);
        }
    }
}

export default ValidationUtils; 