// Módulo de utilidades para cadenas de texto
export class StringUtils {
    // Capitalizar primera letra
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Capitalizar todas las palabras
    static capitalizeWords(str) {
        if (!str) return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    // Eliminar espacios en blanco
    static trim(str) {
        if (!str) return '';
        return str.trim();
    }

    // Eliminar espacios extras
    static removeExtraSpaces(str) {
        if (!str) return '';
        return str.replace(/\s+/g, ' ').trim();
    }

    // Convertir a minúsculas
    static toLowerCase(str) {
        if (!str) return '';
        return str.toLowerCase();
    }

    // Convertir a mayúsculas
    static toUpperCase(str) {
        if (!str) return '';
        return str.toUpperCase();
    }

    // Verificar si contiene texto
    static contains(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().includes(search.toLowerCase());
    }

    // Verificar si comienza con texto
    static startsWith(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().startsWith(search.toLowerCase());
    }

    // Verificar si termina con texto
    static endsWith(str, search) {
        if (!str || !search) return false;
        return str.toLowerCase().endsWith(search.toLowerCase());
    }

    // Reemplazar texto
    static replace(str, search, replace) {
        if (!str) return '';
        return str.replace(new RegExp(search, 'gi'), replace);
    }

    // Reemplazar todos los textos
    static replaceAll(str, search, replace) {
        if (!str) return '';
        return str.split(search).join(replace);
    }

    // Obtener longitud
    static length(str) {
        if (!str) return 0;
        return str.length;
    }

    // Obtener subcadena
    static substring(str, start, end) {
        if (!str) return '';
        return str.substring(start, end);
    }

    // Dividir texto
    static split(str, separator) {
        if (!str) return [];
        return str.split(separator);
    }

    // Unir texto
    static join(array, separator) {
        if (!array) return '';
        return array.join(separator);
    }

    // Verificar si está vacío
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }

    // Verificar si no está vacío
    static isNotEmpty(str) {
        return !this.isEmpty(str);
    }

    // Verificar si es igual
    static equals(str1, str2) {
        if (!str1 || !str2) return false;
        return str1.toLowerCase() === str2.toLowerCase();
    }

    // Verificar si es igual ignorando mayúsculas/minúsculas
    static equalsIgnoreCase(str1, str2) {
        if (!str1 || !str2) return false;
        return str1.toLowerCase() === str2.toLowerCase();
    }

    // Generar código único
    static generateUniqueCode(prefix = '') {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}${timestamp}${random}`;
    }

    // Validar RUC
    static isValidRUC(ruc) {
        if (!ruc) return false;
        
        // Eliminar caracteres no numéricos
        const cleanRuc = ruc.replace(/\D/g, '');
        
        // Verificar longitud
        if (cleanRuc.length !== 11) return false;
        
        // Verificar que todos sean números
        if (!/^\d+$/.test(cleanRuc)) return false;
        
        // Verificar dígito verificador
        const digits = cleanRuc.split('').map(Number);
        const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += digits[i] * weights[i];
        }
        
        const checkDigit = 11 - (sum % 11);
        const finalCheckDigit = checkDigit === 11 ? 0 : checkDigit;
        
        return finalCheckDigit === digits[10];
    }

    // Validar DNI
    static isValidDNI(dni) {
        if (!dni) return false;
        
        // Eliminar caracteres no numéricos
        const cleanDni = dni.replace(/\D/g, '');
        
        // Verificar longitud
        if (cleanDni.length !== 8) return false;
        
        // Verificar que todos sean números
        if (!/^\d+$/.test(cleanDni)) return false;
        
        return true;
    }

    // Validar correo electrónico
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar URL
    static isValidURL(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Validar teléfono
    static isValidPhone(phone) {
        if (!phone) return false;
        
        // Eliminar caracteres no numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Verificar longitud
        if (cleanPhone.length < 7 || cleanPhone.length > 15) return false;
        
        // Verificar que todos sean números
        if (!/^\d+$/.test(cleanPhone)) return false;
        
        return true;
    }

    // Validar contraseña
    static isValidPassword(password) {
        if (!password) return false;
        
        // Mínimo 8 caracteres
        if (password.length < 8) return false;
        
        // Al menos una letra mayúscula
        if (!/[A-Z]/.test(password)) return false;
        
        // Al menos una letra minúscula
        if (!/[a-z]/.test(password)) return false;
        
        // Al menos un número
        if (!/\d/.test(password)) return false;
        
        // Al menos un carácter especial
        if (!/[!@#$%^&*]/.test(password)) return false;
        
        return true;
    }

    // Encriptar texto
    static encrypt(text) {
        if (!text) return '';
        return btoa(text);
    }

    // Desencriptar texto
    static decrypt(text) {
        if (!text) return '';
        try {
            return atob(text);
        } catch {
            return '';
        }
    }

    // Generar texto aleatorio
    static generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Limpiar string de caracteres especiales
    static cleanString(str) {
        if (!str) return '';
        return str.replace(/[^a-zA-Z0-9\s]/g, '');
    }

    // Truncar string a longitud específica
    static truncate(str, length = 50) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }

    // Formatear RUC
    static formatRUC(ruc) {
        if (!ruc) return '';
        const cleaned = ruc.replace(/\D/g, '');
        if (cleaned.length !== 11) return ruc;
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
    }

    // Formatear DNI
    static formatDNI(dni) {
        if (!dni) return '';
        const cleaned = dni.replace(/\D/g, '');
        if (cleaned.length !== 8) return dni;
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1-$2-$3');
    }

    // Formatear número de teléfono
    static formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 9) return phone;
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    }

    // Sanitizar HTML
    static sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Convertir a slug
    static toSlug(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[áäâà]/g, 'a')
            .replace(/[éëêè]/g, 'e')
            .replace(/[íïîì]/g, 'i')
            .replace(/[óöôò]/g, 'o')
            .replace(/[úüûù]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
} 