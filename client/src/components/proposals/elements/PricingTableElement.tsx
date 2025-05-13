import React from 'react';
import { cn } from '@/lib/utils';

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
  const { items, total } = content;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div 
      className={cn(
        "w-full h-full p-4 overflow-auto",
        isSelected ? "cursor-move" : "cursor-pointer"
      )}
      style={style}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left pb-2 font-medium text-gray-700">Item</th>
            <th className="text-left pb-2 font-medium text-gray-700 hidden sm:table-cell">Description</th>
            <th className="text-right pb-2 font-medium text-gray-700">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 text-sm">{item.name}</td>
              <td className="py-3 text-sm text-gray-600 hidden sm:table-cell">{item.description}</td>
              <td className="py-3 text-sm text-right">{formatCurrency(item.price)}</td>
            </tr>
          ))}
          
          {/* Total row */}
          <tr>
            <td colSpan={2} className="pt-4 text-right font-medium">Total:</td>
            <td className="pt-4 text-right font-bold">{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}