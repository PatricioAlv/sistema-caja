import * as ExcelJS from 'exceljs';
import { ImportedMovement, ImportCustomerData } from '@/types';

export class ExcelImportService {
  static async importCustomerData(file: File): Promise<ImportCustomerData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No se encontró ninguna hoja en el archivo Excel');
      }
      
      // Convertir a JSON
      const jsonData: unknown[][] = [];
      worksheet.eachRow((row) => {
        const rowData: unknown[] = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
        });
        jsonData.push(rowData);
      });
      
      // Buscar las columnas por contenido (más flexible)
      const headers = jsonData[0] || [];
      const columnMap = this.mapColumns(headers);
      
      // Procesar datos desde la fila 1 (saltando headers)
      const movements: ImportedMovement[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const movement: ImportedMovement = {
          fecha: this.parseDate(row[columnMap.fecha]),
          descripcion: String(row[columnMap.descripcion] || '').trim(),
          codigo: String(row[columnMap.codigo] || '').trim(),
          precio: this.parseNumber(row[columnMap.precio]),
          saldo: this.parseNumber(row[columnMap.saldo])
        };
        
        // Solo agregar si tiene datos válidos
        if (movement.descripcion || movement.precio !== 0) {
          movements.push(movement);
        }
      }
      
      // Obtener nombre del cliente del nombre del archivo
      const customerName = file.name
        .replace(/\.(xlsx|xls)$/i, '')
        .replace(/[_-]/g, ' ')
        .trim();
      
      return {
        customerName,
        movements: movements.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      };
    } catch (error) {
      console.error('Error procesando Excel:', error);
      throw new Error(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  private static mapColumns(headers: unknown[]): Record<string, number> {
    const map = {
      fecha: -1,
      descripcion: -1,
      codigo: -1,
      precio: -1,
      saldo: -1
    };
    
    headers.forEach((header, index) => {
      const headerStr = String(header).toLowerCase().trim();
      
      // Mapear fecha
      if (headerStr.includes('fecha') || headerStr.includes('date')) {
        map.fecha = index;
      }
      // Mapear descripción
      else if (headerStr.includes('descripcion') || headerStr.includes('descripción') || 
               headerStr.includes('articulo') || headerStr.includes('artículo') ||
               headerStr.includes('producto') || headerStr.includes('detalle')) {
        map.descripcion = index;
      }
      // Mapear código
      else if (headerStr.includes('codigo') || headerStr.includes('código') ||
               headerStr.includes('cod') || headerStr.includes('sku') ||
               headerStr.includes('prenda')) {
        map.codigo = index;
      }
      // Mapear precio/monto
      else if (headerStr.includes('precio') || headerStr.includes('monto') ||
               headerStr.includes('importe') || headerStr.includes('valor') ||
               headerStr.includes('entrega')) {
        map.precio = index;
      }
      // Mapear saldo
      else if (headerStr.includes('saldo') || headerStr.includes('balance') ||
               headerStr.includes('deuda') || headerStr.includes('debe')) {
        map.saldo = index;
      }
    });
    
    // Si no encontramos alguna columna, usar posiciones por defecto
    if (map.fecha === -1) map.fecha = 0;
    if (map.descripcion === -1) map.descripcion = 1;
    if (map.codigo === -1) map.codigo = 2;
    if (map.precio === -1) map.precio = 3;
    if (map.saldo === -1) map.saldo = 4;
    
    return map;
  }
  
  private static parseDate(dateValue: unknown): string {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    // Si es un número (fecha de Excel)
    if (typeof dateValue === 'number') {
      // Excel fecha serial number
      const excelEpoch = new Date(1900, 0, 1);
      const days = dateValue - 2; // Ajuste para el bug de Excel
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Si es string, intentar parsearlo
    if (typeof dateValue === 'string') {
      // Intentar varios formatos
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY o MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = dateValue.match(format);
        if (match) {
          const [, part1, part2, part3] = match;
          let year, month, day;
          
          if (format === formats[2]) { // YYYY-MM-DD
            year = parseInt(part1);
            month = parseInt(part2);
            day = parseInt(part3);
          } else { // Asumir DD/MM/YYYY
            day = parseInt(part1);
            month = parseInt(part2);
            year = parseInt(part3);
          }
          
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
      
      // Último intento con Date.parse
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  }
  
  private static parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remover caracteres no numéricos excepto punto y coma
      const cleaned = value.replace(/[^\d.,-]/g, '');
      // Reemplazar coma por punto si es decimal
      const normalized = cleaned.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  static validateImportData(data: ImportCustomerData): string[] {
    const errors: string[] = [];
    
    if (!data.customerName || data.customerName.trim().length === 0) {
      errors.push('El nombre del cliente es requerido');
    }
    
    if (!data.movements || data.movements.length === 0) {
      errors.push('No se encontraron movimientos válidos en el archivo');
    }
    
    if (data.movements) {
      let invalidMovements = 0;
      data.movements.forEach((movement) => {
        if (!movement.descripcion && movement.precio === 0) {
          invalidMovements++;
        }
      });
      
      if (invalidMovements > data.movements.length * 0.5) {
        errors.push('Demasiados movimientos sin datos válidos. Verifica el formato del archivo.');
      }
    }
    
    return errors;
  }
}
