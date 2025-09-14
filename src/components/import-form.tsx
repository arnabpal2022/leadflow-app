"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";

interface ImportResult {
  totalRows: number;
  insertedCount: number;
  errorCount: number;
  errors: Array<{ row: number; errors: string[] }>;
}

export default function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const csvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,7000000,0-3m,Website,"Looking for a 2BHK apartment","first-time-buyer,urgent",New
Jane Smith,,9876543211,Mohali,Villa,3,Buy,8000000,12000000,3-6m,Referral,"Interested in villas with garden","luxury,family",Qualified`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buyer-leads-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const name = selectedFile.name || '';
      const isCsvByName = name.toLowerCase().endsWith('.csv');
      const isCsvByType = (selectedFile.type || '').toLowerCase().includes('csv');
      if (isCsvByName || isCsvByType) {
        setFile(selectedFile);
        setResult(null);
        return;
      }
    }
    alert('Please select a valid CSV file');
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/buyers/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setResult(result);
      } else {
  const error = await response.json();
  const details = error.details ? JSON.stringify(error.details) : error.error || 'Import failed';
  alert(details);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Import Instructions
        </h2>
        <ul className="space-y-2 text-blue-800">
          <li>• Maximum 200 rows allowed per import</li>
          <li>
            • Required fields: fullName, phone, city, propertyType, purpose,
            timeline, source
          </li>
          <li>• BHK is required for Apartment and Villa property types</li>
          <li>• Budget max must be greater than or equal to budget min</li>
          <li>• Phone must be 10-15 digits</li>
          <li>• Email format must be valid if provided</li>
        </ul>
        <Button onClick={downloadTemplate} variant="outline" className="mt-4">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* File Upload */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
        <div className="space-y-4">
          <div className="w-full">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full h-12 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border file:border-gray-200 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-2 text-xs text-gray-500">Accepted: .csv — Max 200 rows</p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Import Results</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {result.totalRows}
              </p>
              <p className="text-sm text-blue-800">Total Rows</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {result.insertedCount}
              </p>
              <p className="text-sm text-green-800">Successfully Imported</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {result.errorCount}
              </p>
              <p className="text-sm text-red-800">Errors</p>
            </div>
          </div>

          {result.insertedCount > 0 && (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800">
                Successfully imported {result.insertedCount} buyer leads!
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <h3 className="font-semibold">Import Errors</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.errors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm font-medium text-red-600">
                          {error.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-800">
                          <ul className="list-disc list-inside space-y-1">
                            {error.errors.map((errorMsg, errorIndex) => (
                              <li key={errorIndex}>{errorMsg}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <Button onClick={() => router.push("/buyers")}>
              View All Leads
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
