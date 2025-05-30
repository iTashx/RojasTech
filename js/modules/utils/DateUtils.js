// Módulo de utilidades para fechas
export class DateUtils {
    // Formatear fecha a formato local
    static formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // Formatear fecha completa
    static formatFullDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Formatear período
    static formatPeriod(startDate, endDate) {
        if (!startDate || !endDate) return '';
        return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    }

    // Parsear fecha
    static parseDate(dateStr) {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    }

    // Calcular días entre fechas
    static calculateDaysBetween(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Verificar si una fecha está entre dos fechas
    static isDateBetween(date, startDate, endDate) {
        if (!date || !startDate || !endDate) return false;
        const d = new Date(date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return d >= start && d <= end;
    }

    // Verificar si una fecha es válida
    static isValidDate(date) {
        if (!date) return false;
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    // Obtener fecha actual
    static getCurrentDate() {
        return new Date();
    }

    // Obtener fecha de inicio del mes
    static getStartOfMonth(date = new Date()) {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Obtener fecha de fin del mes
    static getEndOfMonth(date = new Date()) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Obtener fecha de inicio del año
    static getStartOfYear(date = new Date()) {
        const d = new Date(date);
        d.setMonth(0);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Obtener fecha de fin del año
    static getEndOfYear(date = new Date()) {
        const d = new Date(date);
        d.setMonth(11);
        d.setDate(31);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Agregar días a una fecha
    static addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    // Agregar meses a una fecha
    static addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }

    // Agregar años a una fecha
    static addYears(date, years) {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() + years);
        return d;
    }

    // Obtener nombre del mes
    static getMonthName(date = new Date()) {
        return date.toLocaleDateString('es-ES', { month: 'long' });
    }

    // Obtener nombre del día
    static getDayName(date = new Date()) {
        return date.toLocaleDateString('es-ES', { weekday: 'long' });
    }

    // Verificar si es fin de semana
    static isWeekend(date = new Date()) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    // Verificar si es día laborable
    static isWorkday(date = new Date()) {
        return !this.isWeekend(date);
    }

    // Obtener siguiente día laborable
    static getNextWorkday(date = new Date()) {
        let nextDay = this.addDays(date, 1);
        while (this.isWeekend(nextDay)) {
            nextDay = this.addDays(nextDay, 1);
        }
        return nextDay;
    }

    // Obtener día laborable anterior
    static getPreviousWorkday(date = new Date()) {
        let prevDay = this.addDays(date, -1);
        while (this.isWeekend(prevDay)) {
            prevDay = this.addDays(prevDay, -1);
        }
        return prevDay;
    }

    static daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // horas*minutos*segundos*milisegundos
        const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
        return diffDays;
    }

    static formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatRelativeTime(date) {
        if (!date) return '';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) {
            return `hace ${minutes} minutos`;
        } else if (hours < 24) {
            return `hace ${hours} horas`;
        } else if (days < 7) {
            return `hace ${days} días`;
        } else {
            return this.formatDate(date);
        }
    }

    static isDateInRange(date, startDate, endDate) {
        const d = new Date(date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return d >= start && d <= end;
    }

    static getMonthsBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = [];
        
        while (start <= end) {
            months.push(new Date(start));
            start.setMonth(start.getMonth() + 1);
        }
        
        return months;
    }

    static getContractDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

export default DateUtils; 