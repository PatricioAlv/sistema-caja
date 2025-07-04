import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sale, Withdrawal, DailySummary, Business } from '@/types';

export interface DailyClosure {
  date: string;
  sales: Sale[];
  withdrawals: Withdrawal[];
  summary: DailySummary;
  business: Business;
  openingTime?: string;
  closingTime: string;
  responsiblePerson?: string;
}

export class PDFService {
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

  private static formatDateLong(date: string): string {
    return format(new Date(date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
  }

  static generateDailyClosurePDF(closure: DailyClosure): void {
    const doc = new jsPDF();
    
    // Configuración general
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Colores corporativos
    const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
    const secondaryColor: [number, number, number] = [156, 163, 175]; // gray-400
    const successColor: [number, number, number] = [34, 197, 94]; // green-500
    const dangerColor: [number, number, number] = [239, 68, 68]; // red-500
    
    // Header con logo y título
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CIERRE DE CAJA DIARIO', pageWidth / 2, 15, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Caja', pageWidth / 2, 25, { align: 'center' });
    
    // Información del negocio
    yPosition = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL NEGOCIO', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Negocio: ${closure.business.businessName || 'No especificado'}`, 20, yPosition);
    
    if (closure.business.address) {
      yPosition += 5;
      doc.text(`Dirección: ${closure.business.address}`, 20, yPosition);
    }
    
    if (closure.business.phone) {
      yPosition += 5;
      doc.text(`Teléfono: ${closure.business.phone}`, 20, yPosition);
    }
    
    // Información de la fecha y hora
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CIERRE', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatDateLong(closure.date)}`, 20, yPosition);
    
    yPosition += 5;
    doc.text(`Hora de cierre: ${closure.closingTime}`, 20, yPosition);
    
    if (closure.openingTime) {
      yPosition += 5;
      doc.text(`Hora de apertura: ${closure.openingTime}`, 20, yPosition);
    }
    
    if (closure.responsiblePerson) {
      yPosition += 5;
      doc.text(`Responsable: ${closure.responsiblePerson}`, 20, yPosition);
    }
    
    // Resumen general
    yPosition += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL', 20, yPosition);
    
    yPosition += 10;
    
    // Tabla de resumen
    const totalSales = closure.summary.totalCash + closure.summary.totalDigital;
    const summaryData = [
      ['Total Ventas', this.formatCurrency(totalSales)],
      ['Total Retiros', this.formatCurrency(closure.summary.totalWithdrawals)],
      ['Total Comisiones', this.formatCurrency(closure.summary.totalCommissions)],
      ['Balance Final', this.formatCurrency(closure.summary.finalBalance)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Concepto', 'Monto']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Detalle por medio de pago
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE POR MEDIO DE PAGO', 20, yPosition);
    
    yPosition += 10;
    
    // Calcular totales por medio de pago
    const paymentMethods = new Map<string, { sales: number, commissions: number }>();
    
    closure.sales.forEach(sale => {
      const totalAmount = sale.cashAmount + sale.digitalAmount;
      const key = `${sale.paymentMethod}${sale.cardBrand ? ` - ${sale.cardBrand}` : ''}${(sale.installments && sale.installments > 1) ? ` (${sale.installments} cuotas)` : ''}`;
      const current = paymentMethods.get(key) || { sales: 0, commissions: 0 };
      paymentMethods.set(key, {
        sales: current.sales + totalAmount,
        commissions: current.commissions + sale.commissionAmount
      });
    });
    
    const paymentData = Array.from(paymentMethods.entries()).map(([method, data]) => [
      method,
      this.formatCurrency(data.sales),
      this.formatCurrency(data.commissions),
      this.formatCurrency(data.sales - data.commissions)
    ]);
    
    if (paymentData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Medio de Pago', 'Ventas', 'Comisiones', 'Neto']],
        body: paymentData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Detalle de ventas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE VENTAS', 20, yPosition);
    
    yPosition += 10;
    
    const salesData = closure.sales.map(sale => {
      const totalAmount = sale.cashAmount + sale.digitalAmount;
      return [
        this.formatDateTime(sale.createdAt),
        sale.description,
        sale.paymentMethod,
        this.formatCurrency(totalAmount),
        this.formatCurrency(sale.commissionAmount)
      ];
    });
    
    if (salesData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha/Hora', 'Descripción', 'Método', 'Monto', 'Comisión']],
        body: salesData,
        theme: 'grid',
        headStyles: {
          fillColor: successColor,
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Verificar si necesitamos una nueva página para retiros
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Detalle de retiros
    if (closure.withdrawals.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE RETIROS', 20, yPosition);
      
      yPosition += 10;
      
      const withdrawalsData = closure.withdrawals.map(withdrawal => [
        this.formatDateTime(withdrawal.createdAt),
        withdrawal.reason,
        this.formatCurrency(withdrawal.amount)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha/Hora', 'Motivo', 'Monto']],
        body: withdrawalsData,
        theme: 'grid',
        headStyles: {
          fillColor: dangerColor,
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 80 },
          2: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Footer
    const currentPage = doc.getNumberOfPages();
    for (let i = 1; i <= currentPage; i++) {
      doc.setPage(i);
      
      // Línea de separación
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      // Información del footer
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Generado el ${this.formatDateTime(new Date().toISOString())}`, 20, pageHeight - 10);
      doc.text(`Página ${i} de ${currentPage}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
    
    // Descargar el PDF
    const fileName = `cierre-caja-${this.formatDate(closure.date).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }
}
