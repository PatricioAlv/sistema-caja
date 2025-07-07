import { NextRequest, NextResponse } from 'next/server';
import { accountMovementService } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    // Obtener token de autorización del header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }
    
    const movements = await accountMovementService.getMovements({
      customerId: customerId || undefined
    }, token);
    
    // Devolver directamente el array de movimientos para mantener consistencia
    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
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
    
    const movement = await accountMovementService.createMovement(body, token);
    return NextResponse.json(movement);
  } catch (error) {
    console.error('Error creating movement:', error);
    return NextResponse.json(
      { error: 'Error al crear movimiento' },
      { status: 500 }
    );
  }
}
