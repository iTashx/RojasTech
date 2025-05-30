// Módulo de gestión de partidas
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class PartidaManager {
    constructor() {
        this.notifications = new Notifications();
    }

    // Crear partida
    async createPartida(data) {
        try {
            // Validar datos
            if (!data.contractId) throw new Error('El ID del contrato es requerido');
            if (!data.codigo) throw new Error('El código es requerido');
            if (!data.descripcion) throw new Error('La descripción es requerida');
            if (!data.monto) throw new Error('El monto es requerido');

            // Validar contrato
            const contract = await db.contracts.get(data.contractId);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return false;
            }

            // Verificar si existe el código
            const exists = await db.partidas
                .where(['contractId', 'codigo'])
                .equals([data.contractId, data.codigo])
                .first();

            if (exists) {
                this.notifications.error('El código ya existe en este contrato');
                return false;
            }

            // Crear partida
            const partidaId = await db.partidas.add({
                ...data,
                avance: 0,
                fechaCreacion: new Date()
            });

            this.notifications.success('Partida creada');
            return partidaId;
        } catch (error) {
            console.error('Error al crear partida:', error);
            this.notifications.error(error.message || 'Error al crear partida');
            return false;
        }
    }

    // Actualizar partida
    async updatePartida(id, data) {
        try {
            // Validar partida
            const partida = await db.partidas.get(id);
            if (!partida) {
                this.notifications.error('Partida no encontrada');
                return false;
            }

            // Verificar código duplicado
            if (data.codigo && data.codigo !== partida.codigo) {
                const exists = await db.partidas
                    .where(['contractId', 'codigo'])
                    .equals([partida.contractId, data.codigo])
                    .first();

                if (exists) {
                    this.notifications.error('El código ya existe en este contrato');
                    return false;
                }
            }

            // Actualizar partida
            await db.partidas.update(id, data);

            this.notifications.success('Partida actualizada');
            return true;
        } catch (error) {
            console.error('Error al actualizar partida:', error);
            this.notifications.error(error.message || 'Error al actualizar partida');
            return false;
        }
    }

    // Eliminar partida
    async deletePartida(id) {
        try {
            // Validar partida
            const partida = await db.partidas.get(id);
            if (!partida) {
                this.notifications.error('Partida no encontrada');
                return false;
            }

            // Eliminar partida
            await db.partidas.delete(id);

            this.notifications.success('Partida eliminada');
            return true;
        } catch (error) {
            console.error('Error al eliminar partida:', error);
            this.notifications.error(error.message || 'Error al eliminar partida');
            return false;
        }
    }

    // Obtener partida por ID
    async getPartidaById(id) {
        try {
            const partida = await db.partidas.get(id);
            if (!partida) {
                this.notifications.error('Partida no encontrada');
                return null;
            }
            return partida;
        } catch (error) {
            console.error('Error al obtener partida:', error);
            this.notifications.error(error.message || 'Error al obtener partida');
            return null;
        }
    }

    // Listar partidas por contrato
    async listPartidasByContract(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .sortBy('codigo');

            return partidas;
        } catch (error) {
            console.error('Error al listar partidas:', error);
            this.notifications.error(error.message || 'Error al listar partidas');
            return [];
        }
    }

    // Actualizar avance
    async updateAvance(id, avance) {
        try {
            // Validar partida
            const partida = await db.partidas.get(id);
            if (!partida) {
                this.notifications.error('Partida no encontrada');
                return false;
            }

            // Validar avance
            if (avance < 0 || avance > 100) {
                this.notifications.error('El avance debe estar entre 0 y 100');
                return false;
            }

            // Actualizar avance
            await db.partidas.update(id, { avance });

            this.notifications.success('Avance actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar avance:', error);
            this.notifications.error(error.message || 'Error al actualizar avance');
            return false;
        }
    }

    // Obtener estadísticas por contrato
    async getStatsByContract(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .toArray();

            const stats = {
                total: partidas.length,
                montoTotal: partidas.reduce((sum, p) => sum + Number(p.monto), 0),
                avancePromedio: partidas.reduce((sum, p) => sum + p.avance, 0) / partidas.length,
                completadas: partidas.filter(p => p.avance === 100).length,
                enProgreso: partidas.filter(p => p.avance > 0 && p.avance < 100).length,
                noIniciadas: partidas.filter(p => p.avance === 0).length
            };

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            this.notifications.error(error.message || 'Error al obtener estadísticas');
            return null;
        }
    }

    // Obtener partidas por avance
    async getPartidasByAvance(contractId, minAvance, maxAvance) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .and(partida => partida.avance >= minAvance && partida.avance <= maxAvance)
                .toArray();

            return partidas;
        } catch (error) {
            console.error('Error al obtener partidas por avance:', error);
            this.notifications.error(error.message || 'Error al obtener partidas por avance');
            return [];
        }
    }

    // Obtener partidas por monto
    async getPartidasByAmount(contractId, minAmount, maxAmount) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .and(partida => {
                    const monto = Number(partida.monto);
                    return monto >= minAmount && monto <= maxAmount;
                })
                .toArray();

            return partidas;
        } catch (error) {
            console.error('Error al obtener partidas por monto:', error);
            this.notifications.error(error.message || 'Error al obtener partidas por monto');
            return [];
        }
    }

    // Obtener partidas por búsqueda
    async searchPartidas(contractId, query) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .toArray();

            return partidas.filter(partida => {
                const searchStr = `
                    ${partida.codigo}
                    ${partida.descripcion}
                `.toLowerCase();

                return searchStr.includes(query.toLowerCase());
            });
        } catch (error) {
            console.error('Error al buscar partidas:', error);
            this.notifications.error(error.message || 'Error al buscar partidas');
            return [];
        }
    }

    // Obtener partidas completadas
    async getCompletedPartidas(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .and(partida => partida.avance === 100)
                .toArray();

            return partidas;
        } catch (error) {
            console.error('Error al obtener partidas completadas:', error);
            this.notifications.error(error.message || 'Error al obtener partidas completadas');
            return [];
        }
    }

    // Obtener partidas en progreso
    async getInProgressPartidas(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .and(partida => partida.avance > 0 && partida.avance < 100)
                .toArray();

            return partidas;
        } catch (error) {
            console.error('Error al obtener partidas en progreso:', error);
            this.notifications.error(error.message || 'Error al obtener partidas en progreso');
            return [];
        }
    }

    // Obtener partidas no iniciadas
    async getNotStartedPartidas(contractId) {
        try {
            const partidas = await db.partidas
                .where('contractId')
                .equals(contractId)
                .and(partida => partida.avance === 0)
                .toArray();

            return partidas;
        } catch (error) {
            console.error('Error al obtener partidas no iniciadas:', error);
            this.notifications.error(error.message || 'Error al obtener partidas no iniciadas');
            return [];
        }
    }
} 