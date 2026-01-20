/**
 * Test Runner Component
 *
 * Use this component to validate orders and run through workflow tests.
 * Add to App.tsx temporarily for testing, then remove.
 */

import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, STAGE_NUMBER } from '../types';
import { validateOrders, validateStageTransition, ValidationResult } from './testUtils';
import { TEST_ORDERS, getTestOrderSummary } from './testOrders';
import { CheckCircle2, XCircle, AlertTriangle, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface TestRunnerProps {
  orders: Order[];
  onLoadTestOrders: (orders: Order[]) => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ orders, onLoadTestOrders }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  // Run validation
  const runValidation = () => {
    const result = validateOrders(orders);
    setValidationResult(result);
  };

  // Load test orders
  const loadTestOrders = () => {
    onLoadTestOrders(TEST_ORDERS);
    setTestResults(prev => [...prev, `Loaded ${TEST_ORDERS.length} test orders`]);
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get test summary
  const testSummary = useMemo(() => {
    const summary = getTestOrderSummary();
    return Object.entries(summary).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
      stageNum: STAGE_NUMBER[status as OrderStatus]
    })).sort((a, b) => a.stageNum - b.stageNum);
  }, []);

  // Run workflow tests
  const runWorkflowTests = () => {
    const results: string[] = [];

    // Test 1: All orders have valid status
    const invalidStatuses = orders.filter(o =>
      !Object.keys(STAGE_NUMBER).includes(o.status)
    );
    if (invalidStatuses.length === 0) {
      results.push('✅ All orders have valid status');
    } else {
      results.push(`❌ ${invalidStatuses.length} orders have invalid status`);
    }

    // Test 2: Check for duplicate IDs
    const ids = orders.map(o => o.id);
    const uniqueIds = new Set(ids);
    if (ids.length === uniqueIds.size) {
      results.push('✅ No duplicate order IDs');
    } else {
      results.push(`❌ Found ${ids.length - uniqueIds.size} duplicate IDs`);
    }

    // Test 3: Check stage transitions are valid
    orders.forEach(order => {
      const currentStageNum = STAGE_NUMBER[order.status];
      if (currentStageNum > 0) {
        // Check if order could have come from previous stage
        const prevStage = Object.entries(STAGE_NUMBER).find(([_, num]) => num === currentStageNum - 1)?.[0];
        if (prevStage) {
          results.push(`ℹ️ ${order.orderNumber}: At ${order.status} (from ${prevStage})`);
        }
      }
    });

    // Test 4: Lead orders have leadInfo
    const leadsWithoutInfo = orders.filter(o => o.status === 'Lead' && !o.leadInfo);
    if (leadsWithoutInfo.length === 0) {
      results.push('✅ All Lead orders have leadInfo');
    } else {
      results.push(`❌ ${leadsWithoutInfo.length} Lead orders missing leadInfo`);
    }

    // Test 5: Orders past Quote have line items
    const ordersNeedingItems = orders.filter(o => {
      const stageNum = STAGE_NUMBER[o.status];
      return stageNum > 1 && o.lineItems.length === 0;
    });
    if (ordersNeedingItems.length === 0) {
      results.push('✅ All orders past Quote have line items');
    } else {
      results.push(`⚠️ ${ordersNeedingItems.length} orders missing line items`);
    }

    // Test 6: Art Confirmation orders have art data
    const artOrders = orders.filter(o =>
      STAGE_NUMBER[o.status] >= 3 && o.artStatus === 'Not Started'
    );
    if (artOrders.length === 0) {
      results.push('✅ Orders past Art Confirmation have art status');
    } else {
      results.push(`⚠️ ${artOrders.length} orders with art status "Not Started" past Art Confirmation stage`);
    }

    // Test 7: Production orders have prep status
    const productionOrders = orders.filter(o =>
      STAGE_NUMBER[o.status] >= 7
    );
    productionOrders.forEach(o => {
      const hasScreenPrint = o.lineItems.some(li => li.decorationType === 'ScreenPrint');
      const hasEmbroidery = o.lineItems.some(li => li.decorationType === 'Embroidery');
      const hasDTF = o.lineItems.some(li => li.decorationType === 'DTF');

      if (hasScreenPrint && !o.prepStatus.screensBurned) {
        results.push(`⚠️ ${o.orderNumber}: Has screen print but screens not burned`);
      }
      if (hasEmbroidery && !o.prepStatus.artworkDigitized) {
        results.push(`⚠️ ${o.orderNumber}: Has embroidery but not digitized`);
      }
      if (hasDTF && !o.prepStatus.gangSheetCreated) {
        results.push(`⚠️ ${o.orderNumber}: Has DTF but gang sheet not created`);
      }
    });

    // Test 8: Fulfillment orders have method set
    const fulfillmentOrders = orders.filter(o =>
      o.status === 'Fulfillment' || STAGE_NUMBER[o.status] > 8
    );
    fulfillmentOrders.forEach(o => {
      if (!o.fulfillment.method) {
        results.push(`⚠️ ${o.orderNumber}: At/past Fulfillment but no method set`);
      }
    });

    // Test 9: Invoice orders have invoice data
    const invoiceOrders = orders.filter(o =>
      STAGE_NUMBER[o.status] >= 9
    );
    invoiceOrders.forEach(o => {
      if (!o.invoiceStatus.invoiceCreated) {
        results.push(`⚠️ ${o.orderNumber}: At/past Invoice but invoice not created`);
      }
    });

    // Test 10: Closed orders have closure data
    const closedOrders = orders.filter(o => o.status === 'Closed');
    closedOrders.forEach(o => {
      if (!o.closedAt) {
        results.push(`⚠️ ${o.orderNumber}: Closed but no closedAt date`);
      }
      if (!o.closedReason) {
        results.push(`⚠️ ${o.orderNumber}: Closed but no reason`);
      }
    });

    results.push(`\n📊 Total Tests: ${results.filter(r => r.startsWith('✅') || r.startsWith('❌')).length}`);
    results.push(`✅ Passed: ${results.filter(r => r.startsWith('✅')).length}`);
    results.push(`❌ Failed: ${results.filter(r => r.startsWith('❌')).length}`);
    results.push(`⚠️ Warnings: ${results.filter(r => r.startsWith('⚠️')).length}`);

    setTestResults(results);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <h1 className="text-2xl font-bold">Pallet Test Runner</h1>
          <p className="text-slate-400 text-sm mt-1">Validate data structure and run workflow tests</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={loadTestOrders}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Play size={18} />
              Load 20 Test Orders
            </button>
            <button
              onClick={runValidation}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              <CheckCircle2 size={18} />
              Validate Current Orders
            </button>
            <button
              onClick={runWorkflowTests}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Play size={18} />
              Run Workflow Tests
            </button>
          </div>

          {/* Current Orders Summary */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('summary')}
            >
              <h3 className="font-bold text-slate-800">Current Orders Summary ({orders.length} total)</h3>
              {expandedSections['summary'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections['summary'] && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Object.entries(STAGE_NUMBER).map(([status, num]) => {
                  const count = orders.filter(o => o.status === status).length;
                  return (
                    <div key={status} className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="text-xs text-slate-500">{num}. {status}</p>
                      <p className="text-xl font-bold text-slate-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test Orders Summary */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('testOrders')}
            >
              <h3 className="font-bold text-blue-800">Test Orders Available ({TEST_ORDERS.length} total)</h3>
              {expandedSections['testOrders'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections['testOrders'] && (
              <div className="mt-4 space-y-2">
                {testSummary.map(({ status, count, stageNum }) => (
                  <div key={status} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <span className="text-sm text-slate-600">{stageNum}. {status}</span>
                    <span className="font-bold text-blue-600">{count} orders</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className={`rounded-xl p-4 ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('validation')}
              >
                <div className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <h3 className={`font-bold ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    Validation Results: {validationResult.valid ? 'PASSED' : 'FAILED'}
                  </h3>
                </div>
                {expandedSections['validation'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {expandedSections['validation'] && (
                <div className="mt-4 space-y-4">
                  {validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Errors ({validationResult.errors.length})</h4>
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        {validationResult.errors.map((err, i) => (
                          <p key={i} className="text-sm text-red-600 font-mono">{err}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-amber-700 mb-2">Warnings ({validationResult.warnings.length})</h4>
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        {validationResult.warnings.map((warn, i) => (
                          <p key={i} className="text-sm text-amber-600 font-mono">{warn}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Order Results</h4>
                    <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                      {validationResult.orderResults.map((result, i) => (
                        <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0">
                          {result.valid ? (
                            <CheckCircle2 className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                          <span className="text-sm font-medium">{result.orderNumber}</span>
                          {!result.valid && (
                            <span className="text-xs text-red-500">({result.errors.length} errors)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('tests')}
              >
                <h3 className="font-bold text-slate-800">Workflow Test Results</h3>
                {expandedSections['tests'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {expandedSections['tests'] && (
                <div className="mt-4 bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                  {testResults.map((result, i) => (
                    <p key={i} className={`text-sm font-mono py-0.5 ${
                      result.startsWith('✅') ? 'text-green-600' :
                      result.startsWith('❌') ? 'text-red-600' :
                      result.startsWith('⚠️') ? 'text-amber-600' :
                      result.startsWith('ℹ️') ? 'text-blue-600' :
                      'text-slate-600'
                    }`}>
                      {result}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 flex justify-end">
          <p className="text-sm text-slate-500">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;
