// Nosco-app/frontend/src/services/currencyService.js

import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase_config';

/**
 * Service for handling currency exchange rates and conversions
 */
class CurrencyService {
  constructor() {
    this.exchangeRates = {};
    this.currencies = [];
    this.defaultCurrency = 'USD';
  }

  /**
   * Initialize the currency service by loading exchange rates from Firestore
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Fetch exchange rates from Firestore
      const docRef = doc(firestore, 'settings', 'exchangeRates');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Format currencies for dropdown selection
        this.currencies = (data.selectedCurrencies || []).map((c) => ({
          value: c,
          label: c
        }));
        
        this.exchangeRates = data.rates || {};
        
        console.log('[CurrencyService] Loaded exchange rates:', this.exchangeRates);
      } else {
        console.log('[CurrencyService] No document found for exchangeRates.');
        throw new Error('Exchange rates not found');
      }
      
      // Fetch default currency from admin preferences
      try {
        const prefRef = doc(firestore, 'settings', 'adminPreferences');
        const prefSnap = await getDoc(prefRef);
        
        if (prefSnap.exists()) {
          const prefData = prefSnap.data();
          if (prefData.defaultCurrency) {
            this.defaultCurrency = prefData.defaultCurrency;
          }
        }
      } catch (err) {
        console.error('[CurrencyService] Error fetching admin preferences:', err);
        // Fallback to USD if there's an error
      }
      
      return this.exchangeRates;
    } catch (err) {
      console.error('[CurrencyService] ERROR initializing:', err);
      throw err;
    }
  }

  /**
   * Convert an amount from one currency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code (defaults to USD)
   * @returns {number} Converted amount
   */
  convertCurrency(amount, fromCurrency, toCurrency = 'USD') {
    if (!amount || isNaN(amount)) return 0;
    if (!fromCurrency || !toCurrency) return amount;
    if (fromCurrency === toCurrency) return amount;

    // Check if we have exchange rates for both currencies
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      console.warn(`[CurrencyService] Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
      return amount;
    }

    // First convert to USD (base currency)
    const amountInUSD = amount / this.exchangeRates[fromCurrency];
    
    // If target is USD, return the USD amount
    if (toCurrency === 'USD') return amountInUSD;
    
    // Otherwise convert from USD to target currency
    return amountInUSD * this.exchangeRates[toCurrency];
  }

  /**
   * Format a currency amount with the appropriate symbol
   * @param {number} amount - The amount to format
   * @param {string} currencyCode - The currency code
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currencyCode = 'USD') {
    if (amount === null || amount === undefined) return '';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.error(`[CurrencyService] Error formatting currency: ${error}`);
      return `${amount} ${currencyCode}`;
    }
  }

  /**
   * Get the available currencies for dropdown selection
   * @returns {Array} Available currencies formatted for dropdown
   */
  getCurrencies() {
    return this.currencies;
  }

  /**
   * Get the exchange rates
   * @returns {Object} Exchange rates
   */
  getExchangeRates() {
    return this.exchangeRates;
  }

  /**
   * Get the default currency
   * @returns {string} Default currency code
   */
  getDefaultCurrency() {
    return this.defaultCurrency;
  }
}

// Create singleton instance
const currencyService = new CurrencyService();

export default currencyService;