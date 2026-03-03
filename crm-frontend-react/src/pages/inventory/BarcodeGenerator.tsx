import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import Modal from '../../components/ui/Modal';
import type { InventoryItem } from '../../types';

interface BarcodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export default function BarcodeGenerator({ isOpen, onClose, item }: BarcodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isOpen && item && svgRef.current) {
      try {
        JsBarcode(svgRef.current, item.sku, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch {
        // invalid barcode
      }
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handlePrint = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><body style="text-align:center;padding:20px">
        <h3>${item.name}</h3>
        ${svg.outerHTML}
        <script>window.print();window.close();</script>
      </body></html>
    `);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Штрих-код: ${item.name}`} size="sm">
      <div className="text-center space-y-4">
        <svg ref={svgRef} />
        <div className="text-sm text-gray-500">
          <p>SKU: {item.sku}</p>
          <p>{item.name}</p>
        </div>
        <button onClick={handlePrint} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
          <i className="fas fa-print mr-2" />Печать
        </button>
      </div>
    </Modal>
  );
}
