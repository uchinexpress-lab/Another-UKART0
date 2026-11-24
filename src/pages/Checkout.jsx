        <label className={labelClass}>
          <Tag className="w-3.5 h-3.5" /> Voucher / Promo Code
        </label>

        {voucher ? (
          <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2.5">
            <span className="text-sm font-semibold text-retail">
              {voucher.code} ({voucher.discount_type === 'fixed_amount'
                ? `₦${(voucher.discount_amount || 0).toLocaleString()} off`
                : `${voucher.discount_percent}% off`})
            </span>

            <button
              onClick={() => {
                setVoucher(null);
                setVoucherCode('');
              }}
              className="text-retail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Enter code"
              className="uk-input flex-1"
            />

            <button
              onClick={applyVoucher}
              className="px-4 rounded-xl bg-retail text-white text-sm font-semibold"
            >
              Apply
            </button>
          </div>
        )}

        {voucherError && (
          <p className="text-xs text-red-500 mt-1.5">{voucherError}</p>
        )}
      </div>

      {/* Order summary */}
      <div className="uk-card p-4 space-y-2">
        <p className="text-sm font-bold text-foreground mb-1">Order Summary</p>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground font-medium">₦{total.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Delivery fee
            {deliveryDiscount > 0 && (
              <span className="block text-[11px] font-semibold text-retail">
                {deliveryDiscountPercent}% splash discount
              </span>
            )}
          </span>

          <span className="text-right">
            {deliveryDiscount > 0 && (
              <span className="block text-[12px] text-muted-foreground line-through">
                ₦{deliveryBase.toLocaleString()}
              </span>
            )}

            <span className="text-foreground font-semibold">
              {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
            </span>
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service fee</span>
          <span className="text-foreground font-medium">₦{serviceFee.toLocaleString()}</span>
        </div>

        {firstOrderDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">First Order Discount</span>
            <span className="text-retail font-semibold">−₦{firstOrderDiscount.toLocaleString()}</span>
          </div>
        )}

        {(referralDiscount + voucherDiscount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount {voucher ? `(${voucher.code})` : ''}</span>
            <span className="text-retail font-semibold">
              −₦{(referralDiscount + voucherDiscount).toLocaleString()}
            </span>
          </div>
        )}

        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-retail">₦{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Same-day cutoff notice */}
      <div className="uk-card p-3.5 mt-4 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-retail shrink-0 mt-0.5" />
        <p className="text-[12px] font-medium text-foreground">
          Orders placed from 5pm will be delivered the next day.
        </p>
      </div>

      {/* Pay button */}
      <div className="mt-3">
        <button onClick={placeOrder} disabled={!canPlace} className="uk-btn">
          {placing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing payment...
            </>
          ) : (
            <>Pay ₦{grandTotal.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}