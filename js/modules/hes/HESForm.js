async handleSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = this.getFormData();
        
        if (!this.validarFormulario(formData)) {
            return;
        }

        // Validar que los montos sean números válidos
        if (isNaN(formData.monto) || formData.monto <= 0) {
            this.mostrarError('El monto debe ser un número válido mayor a 0');
            return;
        }

        // Formatear montos antes de guardar
        formData.monto = NumberUtils.formatNumber(formData.monto);
        formData.subtotal = NumberUtils.formatNumber(formData.subtotal);
        formData.igv = NumberUtils.formatNumber(formData.igv);
        formData.total = NumberUtils.formatNumber(formData.total);
        formData.gastosAdministrativos = NumberUtils.formatNumber(formData.gastosAdministrativos);

        // Guardar en la base de datos
        if (formData.id) {
            await db.hes.update(formData.id, formData);
        } else {
            await db.hes.add(formData);
        }

        this.limpiarFormulario();
        await this.hesManager.loadHES();
        
        this.hesManager.notifications.addNotification(
            'Éxito',
            `HES ${formData.id ? 'actualizado' : 'creado'} correctamente`,
            'success'
        );
    } catch (error) {
        console.error('Error al procesar el HES:', error);
        this.hesManager.notifications.addNotification(
            'Error',
            'Error al procesar el HES: ' + error.message,
            'error'
        );
    }
}

validarFormulario(data) {
    if (!data.numeroHES) {
        this.mostrarError('El número de HES es requerido');
        return false;
    }

    if (!data.contratoId) {
        this.mostrarError('Debe seleccionar un contrato');
        return false;
    }

    if (!data.fechaInicio || !data.fechaFin) {
        this.mostrarError('Las fechas son requeridas');
        return false;
    }

    if (data.fechaInicio > data.fechaFin) {
        this.mostrarError('La fecha de inicio debe ser anterior a la fecha de fin');
        return false;
    }

    if (!data.monto || isNaN(data.monto) || data.monto <= 0) {
        this.mostrarError('El monto debe ser un número válido mayor a 0');
        return false;
    }

    return true;
} 