import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sale, Withdrawal, BusinessConfig } from '@/types';

export interface ReceiptData {
  type: 'sale' | 'withdrawal';
  data: Sale | Withdrawal;
  business: BusinessConfig;
  receiptNumber: string;
  customerName?: string;
  customerPhone?: string;
}

export class ReceiptService {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  }

  private static formatDateTime(date: string): string {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
  }

  private static formatDate(date: string): string {
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  }

  private static getPaymentMethodLabel(method: string): string {
    const methods: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'qr': 'QR (Modo/CVU)',
      'tarjeta_debito': 'Tarjeta de Débito',
      'tarjeta_credito': 'Tarjeta de Crédito'
    };
    return methods[method] || method;
  }

  private static getWithdrawalReasonLabel(reason: string): string {
    const reasons: { [key: string]: string } = {
      'gastos_operativos': 'Gastos Operativos',
      'pago_proveedores': 'Pago a Proveedores',
      'salarios': 'Salarios',
      'servicios': 'Servicios',
      'impuestos': 'Impuestos',
      'personal': 'Gastos Personales',
      'otros': 'Otros'
    };
    return reasons[reason] || reason;
  }

  static generateReceiptPDF(receiptData: ReceiptData): Blob {
    const doc = new jsPDF();
    
    // Configuración general
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;
    
    // Colores
    const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
    const secondaryColor: [number, number, number] = [107, 114, 128]; // gray-500
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = receiptData.type === 'sale' ? 'COMPROBANTE DE VENTA' : 'COMPROBANTE DE RETIRO';
    doc.text(title, pageWidth / 2, 18, { align: 'center' });
    
    // Información del negocio
    yPosition = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(receiptData.business.businessName || 'Negocio', 20, yPosition);
    
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (receiptData.business.address) {
      doc.text(`Dirección: ${receiptData.business.address}`, 20, yPosition);
      yPosition += 4;
    }
    if (receiptData.business.phone) {
      doc.text(`Teléfono: ${receiptData.business.phone}`, 20, yPosition);
      yPosition += 4;
    }
    
    // Número de comprobante y fecha
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nº ${receiptData.receiptNumber}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatDateTime(receiptData.data.createdAt)}`, pageWidth - 20, yPosition, { align: 'right' });
    
    // Línea separadora
    yPosition += 10;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    // Datos del cliente (si los hay)
    if (receiptData.customerName || receiptData.customerPhone) {
      yPosition += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL CLIENTE:', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      if (receiptData.customerName) {
        doc.text(`Cliente: ${receiptData.customerName}`, 20, yPosition);
        yPosition += 5;
      }
      if (receiptData.customerPhone) {
        doc.text(`Teléfono: ${receiptData.customerPhone}`, 20, yPosition);
        yPosition += 5;
      }
      
      yPosition += 5;
      doc.line(20, yPosition, pageWidth - 20, yPosition);
    }
    
    // Detalles de la operación
    yPosition += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE LA OPERACIÓN:', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (receiptData.type === 'sale') {
      const sale = receiptData.data as Sale;
      const totalAmount = sale.cashAmount + sale.digitalAmount;
      
      doc.text(`Descripción: ${sale.description}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Medio de pago: ${this.getPaymentMethodLabel(sale.paymentMethod)}`, 20, yPosition);
      yPosition += 6;
      
      if (sale.cardBrand) {
        doc.text(`Tarjeta: ${sale.cardBrand.toUpperCase()}`, 20, yPosition);
        yPosition += 6;
      }
      
      if (sale.installments && sale.installments > 1) {
        doc.text(`Cuotas: ${sale.installments}`, 20, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`SUBTOTAL: ${this.formatCurrency(totalAmount)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 6;
      
      if (sale.commissionAmount > 0) {
        doc.text(`Comisión: -${this.formatCurrency(sale.commissionAmount)}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      doc.setFontSize(12);
      doc.text(`TOTAL: ${this.formatCurrency(totalAmount - sale.commissionAmount)}`, pageWidth - 20, yPosition, { align: 'right' });
      
    } else {
      const withdrawal = receiptData.data as Withdrawal;
      
      doc.text(`Motivo: ${this.getWithdrawalReasonLabel(withdrawal.reason)}`, 20, yPosition);
      yPosition += 6;
      
      if (withdrawal.description) {
        doc.text(`Descripción: ${withdrawal.description}`, 20, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`MONTO RETIRADO: ${this.formatCurrency(withdrawal.amount)}`, pageWidth - 20, yPosition, { align: 'right' });
    }
    
    // Footer
    yPosition += 30;
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Este comprobante es válido como constancia de la operación realizada.', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.text(`Generado el ${this.formatDateTime(new Date().toISOString())}`, pageWidth / 2, yPosition, { align: 'center' });
    
    // Retornar como Blob para poder usar con WhatsApp
    return doc.output('blob');
  }

  static downloadReceiptPDF(receiptData: ReceiptData): void {
    const doc = new jsPDF();
    
    // Reutilizar la lógica de generación
    const blob = this.generateReceiptPDF(receiptData);
    
    // Crear URL y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-${receiptData.receiptNumber}.pdf`;
    link.click();
    
    // Limpiar
    URL.revokeObjectURL(url);
  }

  static async sendToWhatsApp(receiptData: ReceiptData): Promise<void> {
    try {
      // Generar el PDF
      const blob = this.generateReceiptPDF(receiptData);
      
      // Crear un FormData para subir el archivo (en el futuro podrías usar un servicio de almacenamiento)
      const file = new File([blob], `comprobante-${receiptData.receiptNumber}.pdf`, { type: 'application/pdf' });
      
      // Por ahora, generamos el mensaje de WhatsApp con los detalles
      let message = `🧾 *COMPROBANTE ${receiptData.type === 'sale' ? 'DE VENTA' : 'DE RETIRO'}*\n\n`;
      message += `🏪 *${receiptData.business.businessName}*\n`;
      message += `📋 Comprobante Nº: ${receiptData.receiptNumber}\n`;
      message += `📅 Fecha: ${this.formatDateTime(receiptData.data.createdAt)}\n\n`;
      
      if (receiptData.customerName) {
        message += `👤 Cliente: ${receiptData.customerName}\n`;
      }
      
      if (receiptData.type === 'sale') {
        const sale = receiptData.data as Sale;
        const totalAmount = sale.cashAmount + sale.digitalAmount;
        
        message += `📝 Descripción: ${sale.description}\n`;
        message += `💳 Medio de pago: ${this.getPaymentMethodLabel(sale.paymentMethod)}\n`;
        
        if (sale.cardBrand) {
          message += `🏧 Tarjeta: ${sale.cardBrand.toUpperCase()}\n`;
        }
        
        if (sale.installments && sale.installments > 1) {
          message += `📊 Cuotas: ${sale.installments}\n`;
        }
        
        message += `\n💰 *TOTAL: ${this.formatCurrency(totalAmount - sale.commissionAmount)}*\n`;
        
        if (sale.commissionAmount > 0) {
          message += `💸 Comisión: ${this.formatCurrency(sale.commissionAmount)}\n`;
        }
      } else {
        const withdrawal = receiptData.data as Withdrawal;
        
        message += `📝 Motivo: ${this.getWithdrawalReasonLabel(withdrawal.reason)}\n`;
        if (withdrawal.description) {
          message += `📄 Descripción: ${withdrawal.description}\n`;
        }
        message += `\n💰 *MONTO RETIRADO: ${this.formatCurrency(withdrawal.amount)}*\n`;
      }
      
      message += `\n✅ Gracias por su compra!\n`;
      message += `📞 ${receiptData.business.phone || 'Contacto disponible'}`;
      
      // Abrir WhatsApp con el mensaje
      const phoneNumber = receiptData.customerPhone ? receiptData.customerPhone.replace(/\D/g, '') : '';
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('Error enviando a WhatsApp:', error);
      throw error;
    }
  }

  static generateReceiptNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    
    return `${year}${month}${day}-${time}`;
  }
}
