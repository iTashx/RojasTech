// Módulo de utilidades para formateo
import { DateUtils } from './DateUtils.js';
import { NumberUtils } from './NumberUtils.js';
import { StringUtils } from './StringUtils.js';

export class FormatUtils {
    // Formatear monto
    static formatAmount(amount) {
        return NumberUtils.formatCurrency(amount);
    }

    // Formatear número
    static formatNumber(number, decimals = 2) {
        return NumberUtils.formatNumber(number, decimals);
    }

    // Formatear porcentaje
    static formatPercentage(number) {
        return `${NumberUtils.formatNumber(number)}%`;
    }

    // Formatear fecha
    static formatDate(date) {
        return DateUtils.formatDate(date);
    }

    // Formatear fecha completa
    static formatFullDate(date) {
        return DateUtils.formatFullDate(date);
    }

    // Formatear período
    static formatPeriod(startDate, endDate) {
        return DateUtils.formatPeriod(startDate, endDate);
    }

    // Formatear RUC
    static formatRUC(ruc) {
        if (!ruc) return '';
        const cleanRuc = ruc.replace(/\D/g, '');
        if (cleanRuc.length !== 11) return ruc;
        return cleanRuc.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
    }

    // Formatear DNI
    static formatDNI(dni) {
        if (!dni) return '';
        const cleanDni = dni.replace(/\D/g, '');
        if (cleanDni.length !== 8) return dni;
        return cleanDni.replace(/(\d{2})(\d{3})(\d{3})/, '$1-$2-$3');
    }

    // Formatear teléfono
    static formatPhone(phone) {
        if (!phone) return '';
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 9) return phone;
        return cleanPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
    }

    // Formatear estado
    static formatStatus(status) {
        if (!status) return '';
        
        const statusMap = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'pending': 'Pendiente',
            'completed': 'Completado',
            'cancelled': 'Cancelado',
            'expired': 'Vencido'
        };

        return statusMap[status.toLowerCase()] || status;
    }

    // Formatear estado de avance
    static formatProgressStatus(progress) {
        if (!progress && progress !== 0) return '';
        
        const progressNum = NumberUtils.parseNumber(progress);
        let status = '';
        
        if (progressNum === 0) {
            status = 'No iniciado';
        } else if (progressNum < 25) {
            status = 'Iniciado';
        } else if (progressNum < 50) {
            status = 'En progreso';
        } else if (progressNum < 75) {
            status = 'Avanzado';
        } else if (progressNum < 100) {
            status = 'Casi completado';
        } else {
            status = 'Completado';
        }

        return `${status} (${NumberUtils.formatNumber(progressNum)}%)`;
    }

    // Formatear estado de contrato
    static formatContractStatus(contract) {
        if (!contract) return '';
        
        const today = new Date();
        const startDate = new Date(contract.fechaInicio);
        const endDate = new Date(contract.fechaFin);
        
        if (contract.estado === 'cancelled') {
            return 'Cancelado';
        }
        
        if (contract.estado === 'completed') {
            return 'Completado';
        }
        
        if (today < startDate) {
            return 'Pendiente';
        }
        
        if (today > endDate) {
            return 'Vencido';
        }
        
        return 'En ejecución';
    }

    // Formatear estado de partida
    static formatPartidaStatus(partida) {
        if (!partida) return '';
        
        const progress = NumberUtils.parseNumber(partida.avance);
        
        if (progress === 0) {
            return 'No iniciada';
        }
        
        if (progress === 100) {
            return 'Completada';
        }
        
        return 'En progreso';
    }

    // Formatear estado de pago
    static formatPaymentStatus(status) {
        if (!status) return '';
        
        const statusMap = {
            'pending': 'Pendiente',
            'paid': 'Pagado',
            'overdue': 'Vencido',
            'cancelled': 'Cancelado'
        };

        return statusMap[status.toLowerCase()] || status;
    }

    // Formatear tipo de documento
    static formatDocumentType(type) {
        if (!type) return '';
        
        const typeMap = {
            'dni': 'DNI',
            'ruc': 'RUC',
            'ce': 'CE',
            'passport': 'Pasaporte'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de moneda
    static formatCurrencyType(type) {
        if (!type) return '';
        
        const typeMap = {
            'pen': 'Soles',
            'usd': 'Dólares',
            'eur': 'Euros'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de contrato
    static formatContractType(type) {
        if (!type) return '';
        
        const typeMap = {
            'service': 'Servicio',
            'work': 'Obra',
            'supply': 'Suministro',
            'consulting': 'Consultoría'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de partida
    static formatPartidaType(type) {
        if (!type) return '';
        
        const typeMap = {
            'material': 'Material',
            'labor': 'Mano de obra',
            'equipment': 'Equipo',
            'other': 'Otro'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de unidad
    static formatUnitType(type) {
        if (!type) return '';
        
        const typeMap = {
            'unit': 'Unidad',
            'kg': 'Kilogramo',
            'm': 'Metro',
            'm2': 'Metro cuadrado',
            'm3': 'Metro cúbico',
            'hour': 'Hora',
            'day': 'Día',
            'month': 'Mes',
            'year': 'Año'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de persona
    static formatPersonType(type) {
        if (!type) return '';
        
        const typeMap = {
            'natural': 'Persona Natural',
            'legal': 'Persona Jurídica'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear tipo de contacto
    static formatContactType(type) {
        if (!type) return '';
        
        const typeMap = {
            'phone': 'Teléfono',
            'email': 'Correo',
            'address': 'Dirección',
            'other': 'Otro'
        };

        return typeMap[type.toLowerCase()] || type;
    }

    // Formatear dirección
    static formatAddress(address) {
        if (!address) return '';
        return StringUtils.capitalizeWords(address.trim());
    }

    // Formatear nombre completo
    static formatFullName(firstName, lastName) {
        if (!firstName && !lastName) return '';
        const first = StringUtils.capitalizeWords(firstName || '');
        const last = StringUtils.capitalizeWords(lastName || '');
        return `${first} ${last}`.trim();
    }

    // Formatear código de contrato
    static formatContractCode(code) {
        if (!code) return '';
        return code.toUpperCase().trim();
    }

    // Formatear descripción
    static formatDescription(description) {
        if (!description) return '';
        return StringUtils.capitalizeWords(description.trim());
    }

    // Formatear duración
    static formatDuration(days) {
        if (!days) return '0 días';
        if (days === 1) return '1 día';
        return `${days} días`;
    }

    // Formatear número a moneda
    static formatCurrency(amount, currency = 'PEN') {
        try {
            return new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            console.error('Error al formatear moneda:', error);
            return amount.toString();
        }
    }

    // Formatear fecha
    static formatDate(date, format = 'dd/MM/yyyy') {
        try {
            const d = new Date(date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const seconds = d.getSeconds().toString().padStart(2, '0');

            return format
                .replace('dd', day)
                .replace('MM', month)
                .replace('yyyy', year)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return date.toString();
        }
    }

    // Formatear porcentaje
    static formatPercentage(value, decimals = 2) {
        try {
            return `${Number(value).toFixed(decimals)}%`;
        } catch (error) {
            console.error('Error al formatear porcentaje:', error);
            return value.toString();
        }
    }

    // Formatear número
    static formatNumber(value, decimals = 2) {
        try {
            return Number(value).toFixed(decimals);
        } catch (error) {
            console.error('Error al formatear número:', error);
            return value.toString();
        }
    }

    // Formatear RUC
    static formatRUC(ruc) {
        try {
            if (!ruc) return '';
            const clean = ruc.replace(/\D/g, '');
            if (clean.length !== 11) return ruc;
            return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
        } catch (error) {
            console.error('Error al formatear RUC:', error);
            return ruc;
        }
    }

    // Formatear DNI
    static formatDNI(dni) {
        try {
            if (!dni) return '';
            const clean = dni.replace(/\D/g, '');
            if (clean.length !== 8) return dni;
            return `${clean.slice(0, 2)}-${clean.slice(2, 7)}-${clean.slice(7)}`;
        } catch (error) {
            console.error('Error al formatear DNI:', error);
            return dni;
        }
    }

    // Formatear teléfono
    static formatPhone(phone) {
        try {
            if (!phone) return '';
            const clean = phone.replace(/\D/g, '');
            if (clean.length !== 9) return phone;
            return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
        } catch (error) {
            console.error('Error al formatear teléfono:', error);
            return phone;
        }
    }

    // Formatear código
    static formatCode(code, prefix = '', length = 6) {
        try {
            if (!code) return '';
            const clean = code.toString().replace(/\D/g, '');
            return `${prefix}${clean.padStart(length, '0')}`;
        } catch (error) {
            console.error('Error al formatear código:', error);
            return code;
        }
    }

    // Formatear nombre
    static formatName(name) {
        try {
            if (!name) return '';
            return name
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } catch (error) {
            console.error('Error al formatear nombre:', error);
            return name;
        }
    }

    // Formatear dirección
    static formatAddress(address) {
        try {
            if (!address) return '';
            return address
                .toLowerCase()
                .split(',')
                .map(part => part.trim())
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(', ');
        } catch (error) {
            console.error('Error al formatear dirección:', error);
            return address;
        }
    }

    // Formatear correo electrónico
    static formatEmail(email) {
        try {
            if (!email) return '';
            return email.toLowerCase().trim();
        } catch (error) {
            console.error('Error al formatear correo electrónico:', error);
            return email;
        }
    }

    // Formatear URL
    static formatURL(url) {
        try {
            if (!url) return '';
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return url.toLowerCase().trim();
        } catch (error) {
            console.error('Error al formatear URL:', error);
            return url;
        }
    }

    // Formatear tamaño de archivo
    static formatFileSize(bytes) {
        try {
            if (!bytes) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let size = bytes;
            let unitIndex = 0;
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
            return `${size.toFixed(2)} ${units[unitIndex]}`;
        } catch (error) {
            console.error('Error al formatear tamaño de archivo:', error);
            return bytes.toString();
        }
    }

    // Formatear duración
    static formatDuration(seconds) {
        try {
            if (!seconds) return '0s';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            const parts = [];
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);
            if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
            return parts.join(' ');
        } catch (error) {
            console.error('Error al formatear duración:', error);
            return seconds.toString();
        }
    }

    // Formatear estado
    static formatStatus(status) {
        try {
            if (!status) return '';
            const statusMap = {
                'activo': 'Activo',
                'inactivo': 'Inactivo',
                'pendiente': 'Pendiente',
                'completado': 'Completado',
                'cancelado': 'Cancelado',
                'vencido': 'Vencido'
            };
            return statusMap[status.toLowerCase()] || status;
        } catch (error) {
            console.error('Error al formatear estado:', error);
            return status;
        }
    }

    // Formatear tipo
    static formatType(type) {
        try {
            if (!type) return '';
            const typeMap = {
                'contrato': 'Contrato',
                'factura': 'Factura',
                'boleta': 'Boleta',
                'guia': 'Guía de Remisión',
                'nota': 'Nota de Crédito',
                'debito': 'Nota de Débito',
                'otro': 'Otro'
            };
            return typeMap[type.toLowerCase()] || type;
        } catch (error) {
            console.error('Error al formatear tipo:', error);
            return type;
        }
    }
} 