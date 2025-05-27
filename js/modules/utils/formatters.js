// Formateadores
export function formatMonto(amount, currency = 'PEN') {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
}

export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

export function formatDateTime(date) {
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

export function formatNumber(number, decimals = 2) {
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number || 0);
}

export function formatPercentage(number, decimals = 2) {
    return new Intl.NumberFormat('es-PE', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number / 100);
}

export function formatDocumentNumber(number) {
    if (!number) return '';
    return number.toString().padStart(8, '0');
}

export function formatPhoneNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return number;
}

export function formatRUC(ruc) {
    if (!ruc) return '';
    const cleaned = ruc.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{8})(\d{1})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return ruc;
}

export function formatDNI(dni) {
    if (!dni) return '';
    const cleaned = dni.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{8})$/);
    if (match) {
        return match[1];
    }
    return dni;
}

export function formatAddress(address) {
    if (!address) return '';
    return address
        .split(',')
        .map(part => part.trim())
        .filter(part => part)
        .join(', ');
}

export function formatName(name) {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function formatEmail(email) {
    if (!email) return '';
    return email.toLowerCase();
}

export function formatStatus(status) {
    const statusMap = {
        'active': 'Activo',
        'inactive': 'Inactivo',
        'pending': 'Pendiente',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

export function formatType(type) {
    const typeMap = {
        'sale': 'Venta',
        'purchase': 'Compra',
        'service': 'Servicio',
        'product': 'Producto'
    };
    return typeMap[type] || type;
}

export function formatPaymentMethod(method) {
    const methodMap = {
        'cash': 'Efectivo',
        'credit_card': 'Tarjeta de Crédito',
        'debit_card': 'Tarjeta de Débito',
        'transfer': 'Transferencia',
        'check': 'Cheque'
    };
    return methodMap[method] || method;
}

export function formatDocumentType(type) {
    const typeMap = {
        'invoice': 'Factura',
        'receipt': 'Recibo',
        'credit_note': 'Nota de Crédito',
        'debit_note': 'Nota de Débito',
        'quote': 'Cotización'
    };
    return typeMap[type] || type;
}

export function formatCurrency(amount, currency = 'PEN') {
    const currencyMap = {
        'PEN': 'S/.',
        'USD': '$',
        'EUR': '€'
    };
    const symbol = currencyMap[currency] || currency;
    return `${symbol} ${formatNumber(amount)}`;
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora mismo';
} 