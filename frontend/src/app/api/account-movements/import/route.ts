import { NextRequest, NextResponse } from 'next/server';
import { accountMovementService } from '@/lib/api';

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
    
    const result = await accountMovementService.importMovements(body, token);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing movements:', error);
    return NextResponse.json(
      { error: 'Error al importar movimientos' },
      { status: 500 }
    );
  }
}
