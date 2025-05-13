import React from 'react';
import { cn } from '@/lib/utils';
import { Table } from '@/components/ui/table';

interface PricingTableElementProps {
  content: {
    items: {
      name: string;
      description: string;
      price: number;
    }[];
    total: number;
  };
  style?: React.CSSProperties;
  isSelected: boolean;
  onChange: (content: any) => void;
}

export function PricingTableElement({ content, style, isSelected }: PricingTableElementProps) {
  const { items = [], total = 0 } = content || {};

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div
      className={cn(
        "w-full h-full p-2 overflow-auto",
        isSelected ? "cursor-text" : "cursor-move"
      )}
      style={style}
    >
      <div className="bg-white rounded-md border w-full">
        <Table>
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr 
                key={index} 
                className={index !== items.length - 1 ? "border-b" : ""}
              >
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-gray-600">{item.description}</td>
                <td className="p-2 text-right">{formatPrice(item.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="p-2" colSpan={2}>Total</td>
              <td className="p-2 text-right">{formatPrice(total)}</td>
            </tr>
          </tfoot>
        </Table>
      </div>
    </div>
  );
}