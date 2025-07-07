import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Obtener token de autorización del header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }
    
    const customers = await customerService.getCustomers({
      name: search || undefined
    }, token);
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

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
    
    const customer = await customerService.createCustomer(body, token);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
