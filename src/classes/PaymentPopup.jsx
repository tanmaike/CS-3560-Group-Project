// PaymentPopup.jsx
import { useState } from 'react';
import './Popup.css';

function PaymentPopup({ balanceDue, invoiceAmount, invoiceId, isPayAll, onClose, onPayment }) {
    const [amount, setAmount] = useState(() => {
        if (isPayAll && balanceDue > 0) {
            return String(balanceDue);
        }
        if (invoiceId && invoiceAmount) {
            return String(invoiceAmount);
        }
        return '';
    });
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [loading, setLoading] = useState(false);

    const isInvoicePayment = !!invoiceId;

    const displayBalance = isInvoicePayment ? invoiceAmount : balanceDue;
    const isFixedAmount = isPayAll || isInvoicePayment;

    const presets = isFixedAmount
        ? [
            { label: `Pay $${displayBalance.toFixed(2)}`, value: displayBalance },
        ]
        : [
            { label: '$50', value: 50 },
            { label: '$100', value: 100 },
            { label: `Pay in Full ($${balanceDue.toFixed(2)})`, value: balanceDue },
        ];

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset.value);
        setAmount(String(preset.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const paymentAmount = Number(amount);
        if (!paymentAmount || paymentAmount <= 0) return;
        if (!isPayAll && paymentAmount > displayBalance) return;

        setLoading(true);
        await new Promise(r => setTimeout(r, 800));

        try {
            const ok = await onPayment?.(paymentAmount, isPayAll ? null : invoiceId);
            if (ok !== false) {
                onClose();
            }
        } catch {
            // Keep the popup open so the user can retry.
            return;
        } finally {
            setLoading(false);
        }
    };

    const isValid = isPayAll
        ? Number(amount) > 0 && Number(amount) <= balanceDue
        : Number(amount) > 0 && Number(amount) <= displayBalance;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-card" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <h2>{isPayAll ? 'Pay All Invoices' : isInvoicePayment ? 'Pay Invoice' : 'Make a Payment'}</h2>
                    <p className="popup-subtitle">
                        {isPayAll
                            ? 'Total outstanding balance'
                            : isInvoicePayment
                                ? `Invoice #${invoiceId} \u2014 $${invoiceAmount?.toFixed(2)}`
                                : 'Current balance: '
                        }
                        {!isPayAll && !isInvoicePayment && (
                            <span className="popup-balance">${balanceDue.toFixed(2)}</span>
                        )}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="popup-form">
                    {!isFixedAmount && (
                        <div className="popup-field">
                            <label className="popup-label">Choose Amount</label>
                            <div className="popup-presets">
                                {presets.map(preset => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        className={`popup-preset-btn ${selectedPreset === preset.value ? 'popup-preset-active' : ''}`}
                                        onClick={() => handlePresetClick(preset)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isFixedAmount && (
                        <>
                            <div className="popup-divider">
                                <span className="popup-divider-line" />
                                <span className="popup-divider-text">or custom amount</span>
                                <span className="popup-divider-line" />
                            </div>
                        </>
                    )}

                    <div className="popup-field">
                        <label className="popup-label">
                            {isPayAll ? 'Total Payment' : isInvoicePayment ? 'Invoice Amount' : 'Custom Amount'}
                        </label>
                        <div className="popup-amount-input">
                            <span className="popup-dollar-sign">$</span>
                            <input
                                type="number"
                                className="popup-input popup-input-dollar"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    if (!isFixedAmount) {
                                        setAmount(e.target.value);
                                        setSelectedPreset(null);
                                    }
                                }}
                                min="0.01"
                                max={displayBalance}
                                step="0.01"
                                readOnly={isFixedAmount}
                            />
                        </div>
                    </div>

                    {!isPayAll && Number(amount) > displayBalance && (
                        <div className="popup-error">
                            Amount exceeds balance of ${displayBalance.toFixed(2)}
                        </div>
                    )}

                    <div className="popup-summary">
                        <div className="popup-summary-row">
                            <span>{isPayAll ? 'Outstanding Balance' : isInvoicePayment ? 'Invoice Amount' : 'Current Balance'}</span>
                            <span>${displayBalance.toFixed(2)}</span>
                        </div>
                        {isValid && Number(amount) > 0 && (
                            <div className="popup-summary-row popup-summary-total">
                                <span>After Payment</span>
                                <span className="popup-remaining">
                  ${Math.max(0, displayBalance - Number(amount)).toFixed(2)}
                </span>
                            </div>
                        )}
                    </div>

                    <div className="popup-actions">
                        <button type="button" className="popup-btn popup-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="popup-btn popup-btn-danger"
                            disabled={!isValid || loading}
                        >
                            {loading ? 'Processing...' : `Pay $${Number(amount || 0).toFixed(2)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PaymentPopup;
