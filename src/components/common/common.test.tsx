import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonCard, SkeletonTable } from './Skeleton';
import { PageLoader } from './PageLoader';
import { Card } from './Card';
import '../../i18n';

describe('Button', () => {
  it('renderiza children y aplica la variante', () => {
    render(<Button variant="danger">Eliminar</Button>);
    const btn = screen.getByRole('button', { name: 'Eliminar' });
    expect(btn.className).toContain('bg-red-600');
  });

  it('respeta el estado disabled', () => {
    render(<Button disabled>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('lanza el click handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>OK</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Input', () => {
  it('muestra label, valor y propaga cambios', () => {
    const onChange = vi.fn();
    render(<Input label="Email" value="a@b.c" onChange={onChange} />);
    const input = screen.getByDisplayValue('a@b.c');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'x@y.z' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('muestra el mensaje de error', () => {
    render(<Input label="Email" error="Campo inválido" />);
    expect(screen.getByText('Campo inválido')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renderiza título y children, y ejecuta onClick', () => {
    const onClick = vi.fn();
    render(
      <Card title="Mi Tarjeta" onClick={onClick}>
        <span>contenido</span>
      </Card>
    );
    fireEvent.click(screen.getByText('contenido'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Modal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Título">
        <span>contenido</span>
      </Modal>
    );
    expect(screen.queryByText('Título')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra título y contenido cuando está abierto', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Título">
        <span>contenido</span>
      </Modal>
    );
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('cierra con la tecla Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Título">
        <span>contenido</span>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('cierra al hacer clic en el backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Título">
        <span>contenido</span>
      </Modal>
    );
    const backdrop = container.querySelector('div.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Pagination', () => {
  const meta = { page: 2, per_page: 10, total: 100, total_pages: 10 };

  it('no renderiza nada con una sola página', () => {
    const { container } = render(
      <Pagination meta={{ ...meta, total_pages: 1 }} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el rango "Mostrando"', () => {
    render(<Pagination meta={meta} onPageChange={() => {}} />);
    expect(screen.getByText(/Mostrando 11-20 de 100/)).toBeInTheDocument();
  });

  it('deshabilita prev en la primera página y next en la última', () => {
    render(<Pagination meta={{ ...meta, page: 1 }} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
    render(<Pagination meta={{ ...meta, page: 10 }} onPageChange={() => {}} />);
    const last = screen.getAllByRole('button');
    expect(last[last.length - 1]).toBeDisabled();
  });

  it('llama onPageChange al hacer clic en una página', () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('usa puntos suspensivos en rangos largos', () => {
    render(<Pagination meta={{ ...meta, page: 4, total_pages: 8 }} onPageChange={() => {}} />);
    expect(screen.getAllByText('...')).toHaveLength(2);
  });
});

describe('Estados visuales', () => {
  it('EmptyState muestra título, descripción y acción', () => {
    render(
      <EmptyState title="Sin datos" description="No hay registros" action={<button>Crear</button>} />
    );
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('No hay registros')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('Skeleton respeta count', () => {
    const { container } = render(<Skeleton count={3} width={50} height={20} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('SkeletonTable renderiza rows x cols', () => {
    const { container } = render(<SkeletonTable rows={5} cols={4} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(20);
  });

  it('SkeletonCard y PageLoader renderizan', () => {
    render(<SkeletonCard />);
    render(<PageLoader />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
