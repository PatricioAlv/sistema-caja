import { NextRequest, NextResponse } from 'next/server';
import { customerService, accountMovementService } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de autorización del header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }
    
    // Obtener todos los clientes
    const customers = await customerService.getCustomers({}, token);
    
    // Obtener balance y fecha de último movimiento para cada cliente
    const customersWithBalances = await Promise.all(
      customers.map(async (customer) => {
        try {
          const movements = await accountMovementService.getMovements(
            { customerId: customer.id },
            token
          );
          
          // Calcular balance actual
          const balance = movements.reduce((sum, movement) => {
            // sale = aumenta la deuda (+)
            // payment = disminuye la deuda (-)
            return movement.type === 'sale' ? sum + movement.amount : sum - movement.amount;
          }, 0);
          
          // Obtener fecha de último movimiento de tipo 'sale'
          const lastSale = movements
            .filter(m => m.type === 'sale')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          // Obtener fecha de último pago
          const lastPayment = movements
            .filter(m => m.type === 'payment')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          return {
            customer,
            balance,
            lastDeliveryDate: lastSale ? lastSale.date : null,
            lastPaymentDate: lastPayment ? lastPayment.date : null
          };
        } catch (error) {
          console.error(`Error getting balance for customer ${customer.id}:`, error);
          return {
            customer,
            balance: 0,
            lastDeliveryDate: null,
            lastPaymentDate: null
          };
        }
      })
    );
    
    return NextResponse.json(customersWithBalances);
  } catch (error) {
    console.error('Error fetching customer balances:', error);
    return NextResponse.json(
      { error: 'Error al obtener saldos de clientes' },
      { status: 500 }
    );
  }
}
