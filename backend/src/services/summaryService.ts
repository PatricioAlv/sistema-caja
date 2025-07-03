import { SalesService } from './salesService';
import { WithdrawalService } from './withdrawalService';
import { DailySummary } from '../../../shared/types';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export class SummaryService {
  private salesService = new SalesService();
  private withdrawalService = new WithdrawalService();

  async getDailySummary(date: string, userId: string): Promise<DailySummary> {
    const sales = await this.salesService.getSalesByDateRange(date, date, userId);
    const withdrawals = await this.withdrawalService.getWithdrawalsByDateRange(date, date, userId);
    
    const summary: DailySummary = {
      date,
      totalCash: 0,
      totalDigital: 0,
      totalCommissions: 0,
      totalNet: 0,
      salesCount: sales.length,
      totalWithdrawals: 0,
      withdrawalsCount: withdrawals.length,
      finalBalance: 0
    };

    // Calcular totales de ventas
    for (const sale of sales) {
      summary.totalCash += sale.cashAmount;
      summary.totalDigital += sale.digitalAmount;
      summary.totalCommissions += sale.commissionAmount;
    }

    // Calcular total de retiros
    for (const withdrawal of withdrawals) {
      summary.totalWithdrawals += withdrawal.amount;
    }

    summary.totalNet = summary.totalCash + summary.totalDigital - summary.totalCommissions;
    summary.finalBalance = summary.totalNet - summary.totalWithdrawals;
    
    return summary;
  }

  async getRangeSummary(startDate: string, endDate: string, userId: string): Promise<DailySummary[]> {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    
    const summaries: DailySummary[] = [];
    
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const summary = await this.getDailySummary(dateStr, userId);
      summaries.push(summary);
    }
    
    return summaries;
  }

  async getMonthSummary(year: number, month: number, userId: string): Promise<DailySummary[]> {
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');
    
    return this.getRangeSummary(startDate, endDate, userId);
  }
}
