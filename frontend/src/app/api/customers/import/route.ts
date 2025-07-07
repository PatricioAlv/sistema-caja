import { NextRequest, NextResponse } from 'next/server';
import { customerService, accountMovementService } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Obtener token de autorización del header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }
    
    const { customerName, movements } = body;
    
    if (!customerName || !movements || !Array.isArray(movements)) {
      return NextResponse.json(
        { error: 'Datos de importación inválidos' },
        { status: 400 }
      );
    }
    
    // Crear o buscar el cliente
    let customer;
    try {
      // Buscar cliente existente por nombre
      const existingCustomers = await customerService.getCustomers({ name: customerName }, token);
      customer = existingCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      
      if (!customer) {
        // Crear nuevo cliente
        customer = await customerService.createCustomer({
          name: customerName,
          email: '',
          phone: '',
          address: '',
          taxId: '',
          creditLimit: 0,
          notes: `Cliente importado desde Excel - ${new Date().toLocaleDateString()}`
        }, token);
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json(
        { error: 'Error al crear o buscar cliente' },
        { status: 500 }
      );
    }
    
    // Procesar movimientos
    const processedMovements = movements.map((movement: {fecha: string, descripcion: string, codigo?: string, precio: number, saldo: number}) => {
      // Determinar tipo de movimiento basado en el monto
      const amount = parseFloat(String(movement.precio)) || 0;
      const type = amount > 0 ? 'sale' : 'payment';
      
      return {
        fecha: movement.fecha,
        descripcion: movement.descripcion || 'Movimiento importado',
        codigo: movement.codigo,
        precio: Math.abs(amount), // Usar valor absoluto
        saldo: parseFloat(String(movement.saldo)) || 0
      };
    });
    
    // Importar movimientos usando el servicio de account movements
    try {
      const result = await accountMovementService.importMovements({
        customerId: customer.id!,
        customerName: customer.name,
        movements: processedMovements
      }, token);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Se importaron ${processedMovements.length} movimientos para ${customer.name}`
      });
    } catch (error) {
      console.error('Error importing movements:', error);
      return NextResponse.json(
        { error: 'Error al importar movimientos' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
