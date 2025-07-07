import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/lib/api';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    await customerService.deleteCustomer(params.id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const customer = await customerService.updateCustomer(params.id, body, token);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}
