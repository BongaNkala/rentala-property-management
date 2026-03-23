import React from 'react';
import { format } from 'date-fns';

interface FinancialStatementProps {
  data: {
    startDate: Date;
    endDate: Date;
    properties: Array<{
      id: string;
      name: string;
      address: string;
      revenue: number;
      expenses: number;
      occupancy: number;
    }>;
    payments: Array<{
      id: string;
      tenant: string;
      property: string;
      amount: number;
      date: string;
      method: string;
    }>;
    maintenance: Array<{
      id: string;
      property: string;
      description: string;
      cost: number;
      date: string;
    }>;
    summary: {
      totalRevenue: number;
      totalExpenses: number;
      netIncome: number;
      totalProperties: number;
      activeLeases: number;
      averageOccupancy: number;
    };
  };
}

const FinancialStatement = React.forwardRef<HTMLDivElement, FinancialStatementProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white text-black p-12 min-h-screen">
        <div className="border-b-4 border-blue-600 pb-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Rentala</h1>
              <p className="text-gray-600 text-lg">Property Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-2">Financial Statement</h2>
              <p className="text-gray-600">
                Period: {format(data.startDate, 'MMM dd, yyyy')} - {format(data.endDate, 'MMM dd, yyyy')}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-blue-600 border-b-2 border-gray-300 pb-2">
            Executive Summary
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                R{data.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">
                R{data.summary.totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Net Income</p>
              <p className="text-3xl font-bold text-blue-600">
                R{data.summary.netIncome.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-4">
            <div className="p-3 border-l-4 border-blue-600 bg-gray-50">
              <p className="text-sm text-gray-600">Properties</p>
              <p className="text-xl font-bold">{data.summary.totalProperties}</p>
            </div>
            <div className="p-3 border-l-4 border-blue-600 bg-gray-50">
              <p className="text-sm text-gray-600">Active Leases</p>
              <p className="text-xl font-bold">{data.summary.activeLeases}</p>
            </div>
            <div className="p-3 border-l-4 border-blue-600 bg-gray-50">
              <p className="text-sm text-gray-600">Avg Occupancy</p>
              <p className="text-xl font-bold">{data.summary.averageOccupancy}%</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-sm text-gray-600 mb-4">Prepared by:</p>
              <div className="border-b-2 border-gray-400 mb-2 pb-8"></div>
              <p className="text-sm font-semibold">Property Manager</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-4">Reviewed by:</p>
              <div className="border-b-2 border-gray-400 mb-2 pb-8"></div>
              <p className="text-sm font-semibold">Financial Officer</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FinancialStatement.displayName = 'FinancialStatement';

export default FinancialStatement;
