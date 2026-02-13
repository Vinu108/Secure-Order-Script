

<script type="module">
            /* ===========================================================
              PHOENIX CHECKOUT REDIRECT SCRIPT — FINAL BUILD
              Version: 2025-11-09
              =========================================================== */
            /* ------------------- PHOENIX SDK LOADER ------------------- */
            !(function (e) {
              let d = document, w = window, h = d.head, s = d.createElement("script");
              s.src = "https://io.ecommcheckout.com/phoenix.min.js";
              h.appendChild(s);
              let p;
              (p = w).addEventListener("load", () => {
                if ("phx" in p) e(p);
                else {
                  let tries = 0, iId = w.setInterval(() => {
                    ("phx" in p || tries > 20) && (clearInterval(iId), e(p));
                    tries++;
                  }, 500);
                }
              });
            })(function (r) { r.phx.initialize(r); });
            /* ===========================================================
              ???? CONFIGURATION
              =========================================================== */
            // ???? Phoenix Checkout URL
            const PHX_CHECKOUT_URL = "https://secureorder.averyjewelry.com";


            // ???? Routing mode
            //   'all'       = all products redirect to Phoenix
            //   'specific'  = only whitelisted product IDs redirect
            const PHX_ROUTING_MODE = "all";
            const PHX_PRODUCT_ALLOWLIST = new Set([
              
            ]);




            // ???? Add-to-Cart buttons (stay on page)
            const ADD_TO_CART_SELECTORS = [
              'button[name="add"]',
              '.btn--add-to-cart',
              '.product-form__submit',
              '.ProductForm__AddToCart',
              '[data-action="add-to-cart"]',
              '[data-pf-type="ProductATC"]',
              '[data-pf-type="ProductATC2"]',
              '[data-gem-action="add-to-cart"]',
              '[data-bold-add-to-cart]',
              '.zipify-product-button',
              '.rebuy-button--add-to-cart'
            ];


            // ⚡ Buy-Now / Checkout buttons (redirect to Phoenix)
            const BUY_NOW_SELECTORS = [
              'button[name="buy_it_now"]',
              'button[aria-label*="buy it now" i]',
              '.shopify-payment-button__button',
              '.shopify-payment-button__button--unbranded',
              '.shopify-payment-button',
              '.product__buy-now',
              '[data-action="buy-now"]',
              '[data-action="checkout"]',
              '[data-replo-checkout-button]',
              '[data-pf-type="ProductCheckout"]',
              '[data-gem-action="buy-now"]',
              '[data-bold-checkout]',
              '[data-rebuy-buy-now]',
              '[data-rebuy-checkout]',
              '.ocu-buy-now-button',
              '.zipify-checkout-button',
              'button[data-checkout="checkout"]',
               'button[data-replo-add-product-variant-to-cart]',
               'button.gp-button-atc[aria-label="Add to cart"]'
            ];








            // ????️ Cart Page Checkout buttons
            const CART_PAGE_CHECKOUT_SELECTORS = [
              'button[name="checkout"]',
              'button#checkout',
               '.cart__checkout',
               '.custom_checkout',
               '.cart__item-row.cart__checkout-wrapper .cart__checkout.cart__ctas.custom_checkout',
              '.cart__checkout-button',
              '#rebuy-cart .rebuy-button.rebuy-cart__checkout-button',
              '.ocu-checkout-button',
              '[form="ocu-cart-form"][name="checkout"]',
              '#kaching-cart__checkout-button',
              '.kaching-cart__checkout-button',
              '[data-instant-layout="CART"] a[rel="noopener noreferrer"]'


            ];








            /* ===========================================================
              ⚙️ HELPER FUNCTIONS
              =========================================================== */
            function isWhitelistedProductId(id) {
              return !!id && PHX_PRODUCT_ALLOWLIST.has(String(id));
            }
            function shouldUsePhoenixForProduct(productId) {
              return PHX_ROUTING_MODE === 'all' || isWhitelistedProductId(productId);
            }
            async function getCart() {
              try { return await fetch('/cart.js').then(r => r.json()); }
              catch { return { items: [] }; }
            }

{% comment %} 
             async function getCartID() {
              try {
                const cart = await fetch('/cart.js').then(r => r.json());
                return cart.token?.replace('%3Fkey%3D', '?key=') || '';
              } catch { return ''; }
            }  {% endcomment %}




async function getCartID(retries = 6, delay = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const cart = await fetch('/cart.js', {
        credentials: 'same-origin',
        cache: 'no-store'
      }).then(r => r.json());

      if (!cart || !cart.token) {
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // Decode safely (Safari fix)
      let token = cart.token;

      try {
        token = decodeURIComponent(token);
      } catch (e) {
        // ignore decode errors
      }

      // Normalize ?key=
      if (!token.includes('?key=')) {
        const match = token.match(/(.+)\?key=(.+)/);
        if (match) token = `${match[1]}?key=${match[2]}`;
      }

      return token;
    } catch (err) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  console.warn('⚠️ Cart token not available (Safari)');
  return '';
}

            function shopID() {
              return window.Shopify?.shop?.split(".")?.[0];
            }




   // ???? Common cart-based redirect handler (DRY’ed from multiple places)
            async function handleCartRedirect() {
              const cart = await getCart();
              if (!cart.items?.length) return;


              const allowed =
                PHX_ROUTING_MODE === 'all' ||
                cart.items.some(it => isWhitelistedProductId(it.product_id));


              if (allowed) {
             
                await redirectToPhoenix();
              } else {
             
                await redirectToNative();
              }
            }




          // === Save all query parameters ONLY IF not already saved ===
(function saveQueryParamsOnce() {
  // Check if already saved for this session
  if (sessionStorage.getItem("query_params")) return;


  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;


  const allParams = {};
  for (const [key, value] of params.entries()) {
    allParams[key] = value;
  }


  // Save them only once per session
  sessionStorage.setItem("query_params", JSON.stringify(allParams));
})();
//end here


            /* ===========================================================
              ???? BUILD CHECKOUT URL
              =========================================================== */
            async function getCheckoutURL() {
              const destination = new URL(PHX_CHECKOUT_URL);
              destination.searchParams.append("store", shopID());
              destination.searchParams.append("cart", await getCartID());




            if(window.token){
                        destination.searchParams.append('event-token',window.token);
                    }




                    const customerCurrency = sessionStorage.getItem("buckscc_customer_currency");
                    const conversionRatesString = sessionStorage.getItem(
                      "bucksccConversionRates"
                    );




                    if (customerCurrency && conversionRatesString) {
                      const cleanedCurrency = customerCurrency.replace(/"/g, "");
                      destination.searchParams.append("target_currency", cleanedCurrency);




                      try {
                        const conversionRates = JSON.parse(conversionRatesString);
                        if (conversionRates.currencyRateToday) {
                          const ratesMatch =
                            conversionRates.currencyRateToday.match(/rates:\s*(\{[^}]+\})/);
                          if (ratesMatch) {
                            const ratesObject = JSON.parse(ratesMatch[1]);
                            if (ratesObject[cleanedCurrency]) {
                              const rate = parseFloat(ratesObject[cleanedCurrency]);
                              const inverseRate = 1 / rate;
                              destination.searchParams.append("cc_rate", inverseRate.toFixed(6));
                            }
                          }
                        }
                      } catch (error) {
                        console.error("Error parsing conversion rates:", error);
                      }
                    }


                    try {
                      const trafficSource = getTrafficSource() || "";
                      if (trafficSource) {
                        destination.searchParams.append("trafficSource", trafficSource);
                      }
                    } catch {
                      console.log("Error getting traffic source");
                    }








              // Fetch stored query params from sessionStorage
  try {


    const storedParams = JSON.parse(sessionStorage.getItem("query_params") || "{}");


    // Append stored params (if any)
    for (const [key, value] of Object.entries(storedParams)) {
      // Only append if not already present
      if (!destination.searchParams.has(key)) {
        destination.searchParams.append(key, value);
      }
    }


  }
  catch (error) {
    console.error("Error parsing query params:", error);
  }
  //end here






            {% comment %} alert(destination.toString());  {% endcomment %}
              return destination.toString();
            }


            async function redirectToPhoenix() {
              console.log("✅ Redirecting to Phoenix checkout...");
              window.location.href = await getCheckoutURL();
            }


            /* ===========================================================
              ???? PRODUCT CONTEXT HELPERS
              =========================================================== */
            function findClosest(el, selector) {
              while (el && el !== document) {
                if (el.matches?.(selector)) return el;
                el = el.parentNode || el.host;
              }
              return null;
            }
            function getProductAndQtyFromContext(ctxEl) {
              const form = findClosest(ctxEl, 'form[action*="/cart"], form[action="/cart/add"], form');
              const productId =
                form?.querySelector('input[name="product-id"]')?.value ||
                window.ShopifyAnalytics?.meta?.product?.id ||
                ctxEl?.dataset?.productId ||
                null;
              const variantId =
                form?.querySelector('input[name="id"], select[name="id"]')?.value ||
                window.ShopifyAnalytics?.meta?.selectedVariantId ||
                null;
              const qty = parseInt(form?.querySelector('input[name="quantity"]')?.value || 1, 10);
              return { productId: String(productId || ''), variantId: String(variantId || ''), qty };
            }
            async function addToCart(variantId, qty) {
              if (!variantId) return;
              await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [{ id: variantId, quantity: qty }] })
              });
            }


            /* ===========================================================
              ⚡ REDIRECT HANDLER Direct Checkout
              =========================================================== */


            async function addThenRedirect2aa(ctxEl, event) {
           
              try {
                if (ctxEl.dataset.phxBusy === '1') return;
                ctxEl.dataset.phxBusy = '1';
                event?.preventDefault?.();
                event?.stopImmediatePropagation?.();
                const { productId, variantId, qty } = getProductAndQtyFromContext(ctxEl);
                if (!variantId) return;
                await addToCart(variantId, qty);
                // alert(`Variant ID: ${variantId}\nQuantity: ${qty}`);
                await handleCartRedirect();
              } catch (e) {
                console.error('Buy Now redirect failed', e);
              } finally {
                ctxEl.dataset.phxBusy = '0';
              }
            }


            /* ===========================================================
              ???? ADD-TO-CART
              =========================================================== */
            function hookAddToCart() {
              ADD_TO_CART_SELECTORS.forEach(sel => {
                document.querySelectorAll(sel).forEach(btn => {
                  if (btn.phx_cartBind) return;
                  btn.phx_cartBind = true;
                });
              });
            }








            /* ===========================================================⚡ BUY-NOW =========================================================== */
            function hookBuyItNow() {
              BUY_NOW_SELECTORS.forEach(sel => {
                document.querySelectorAll(sel).forEach(btn => {
               if (btn.name === "checkout") btn.removeAttribute("onclick");
 
                  if (btn.phx_claimRedirect2) return;
                  btn.phx_claimRedirect2 = true;
                  btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                      e.stopImmediatePropagation();
                    const { productId } = getProductAndQtyFromContext(btn);
                  {% comment %} if (!shouldUsePhoenixForProduct(productId)) return; {% endcomment %}
                    await addThenRedirect2aa(btn, e);
                  }, true);
                });
              });
            } 






            




            /* ===========================================================
              ????️ CART CHECKOUT
              =========================================================== */







            function hookCartPageCheckout() {
              CART_PAGE_CHECKOUT_SELECTORS.forEach(sel => {
                document.querySelectorAll(sel).forEach(btn => {
                  btn.removeAttribute("onclick");
                   btn.removeAttribute("id");
                    btn.removeAttribute("form");
                     btn.removeAttribute("type");
                      btn.removeAttribute("name");
                  btn.onclick = null;
                  if (!btn.classList.contains("cart__ctas")) {
                   btn.classList.add("cart__ctas");
                    btn.classList.add("custom_checkout");
                    }

                  if (btn.name === "checkout") btn.removeAttribute("onclick");
                  if (btn.phx_cartBound) return;
                  btn.phx_cartBound = true;
           
                  btn.addEventListener('click', async (e) => {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                   
                      await handleCartRedirect();
                  }, true);
                });
              });
            }








            /* ===========================================================
               one click upsell app
            ============================================================== */




                    function hookOCUCartCheckout() {




                  /* ✅ Inject CSS once */
                  if (!window.ocuCheckoutStylePatched) {
                    window.ocuCheckoutStylePatched = true;




                    const style = document.createElement('style');
                    style.textContent = `
                      .ocu-checkout-button-new[data-v-2b0d25b4] {
                        background-color: var(--ocu-button-color);
                        border-radius: var(--ocu-main-border-radius);
                        cursor: pointer;
                        touch-action: manipulation;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                        border: none;
                        outline: none;
                        grid-template-rows: 42px;
                        grid-template-columns: 1fr;
                        align-items: center;
                        justify-items: center;
                        min-height: 42px;
                        padding: 0;
                        transition: background-color .2s;
                        display: grid;
                        position: relative;
                      }




                      @media (max-width: 750px) {
                        .ocu-checkout-button-new[data-v-2b0d25b4] {
                          grid-template-rows: 54px;
                        }
                      }




                      .ocu-checkout-button-new[data-v-2b0d25b4]:hover {
                        background-color: var(--ocu-hover-color);
                      }




                      .ocu-checkout-button-new.ocu-disabled[data-v-2b0d25b4]:hover {
                        background-color: var(--ocu-button-color);
                        cursor: default;
                      }




                      .ocu-checkout-button-new[data-v-2b0d25b4]:before {
                        content: "";
                        z-index: 10;
                        width: 100%;
                        height: 100%;
                        position: absolute;
                      }




                      .ocu-checkout-button-new.checkout-edit-mode[data-v-2b0d25b4]:before {
                        display: none;
                      }




                      .ocu-checkout-button-new .ocu-checkout-button-loader[data-v-2b0d25b4] {
                        line-height: 1;
                      }




                      .ocu-checkout-button-new .ocu-checkout-button-loader[data-v-2b0d25b4] .ocu-icon {
                        fill: var(--ocu-button-color);
                        -webkit-filter: invert();
                        filter: invert();
                      }




                      .ocu-checkout-button-new .ocu-checkout-button-text[data-v-2b0d25b4] {
                        min-width: 25px;
                      }
                    `;
                    document.head.appendChild(style);
                  }




                  /* ✅ Modify button class + apply redirect routing */
                  document.querySelectorAll('button.ocu-checkout-button, [form="ocu-cart-form"][name="checkout"]').forEach(btn => {
                    // Rename class
                    if (btn.classList.contains('ocu-checkout-button')) {
                      btn.classList.remove('ocu-checkout-button');
                      btn.classList.add('ocu-checkout-button-new');
                      console.log('✅ Class updated: ocu-checkout-button → ocu-checkout-button-new');
                    }
                    if (btn.phx_cartBound) return;
                    btn.phx_cartBound = true;
                    btn.addEventListener('click', async (e) => {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                   await handleCartRedirect();
                    }, true);
                  });
                }








               /* ===========================================================
              ???? Monster cart DRAWER CHECKOUT
              =========================================================== */




                function hookMuCheckoutButton() {
                  const btn = document.getElementById('mu-checkout-button');
                  if (!btn) return;                
                  if (btn.phx_cartBound) return;    
                  btn.phx_cartBound = true;




                  // Make sure it behaves like your other checkout hooks
                  btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                await handleCartRedirect();
                  }, true); // capture=true to beat framework handlers
                }








            /* ===========================================================
              ???? UPCART DRAWER CHECKOUT (WITH PRODUCT CHECK)
              =========================================================== */
      
function hookUpcartCheckout() {


  /* =====================================================
     CHECK IF UPCART IS USING SHADOW DOM OR NORMAL DOM
  ===================================================== */
  const shadowHost = document.querySelector('#upCart');


  if (shadowHost && shadowHost.shadowRoot) {
    /* ==========================================
         CASE A — SHADOW DOM → USE shadowRoot
    ========================================== */
    const shadowRoot = shadowHost.shadowRoot;


    const observerShadow = new MutationObserver(() => {
      const checkoutLink = shadowRoot.querySelector('.upcart-checkout-button-container a');


      if (checkoutLink && !checkoutLink.phx_claimRedirect2) {
        checkoutLink.phx_claimRedirect2 = true;


        checkoutLink.classList.add('cart__ctas');
        checkoutLink.removeAttribute('href');
        checkoutLink.style.cursor = 'pointer';


        checkoutLink.addEventListener(
          "click",
          async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            await handleCartRedirect();
          },
          true
        );
      }
    });


    observerShadow.observe(shadowRoot, { childList: true, subtree: true });


  } else {
    /* ==========================================
         CASE B — NORMAL DOM → Observe document
    ========================================== */
    const observerNormal = new MutationObserver(() => {
      const checkoutLink = document.querySelector('.upcart-checkout-button-container a');


      if (checkoutLink && !checkoutLink.phx_claimRedirect2) {
        checkoutLink.phx_claimRedirect2 = true;


        checkoutLink.classList.add('cart__ctas');
        checkoutLink.removeAttribute('href');
        checkoutLink.style.cursor = 'pointer';


        checkoutLink.addEventListener(
          "click",
          async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            await handleCartRedirect();
          },
          true
        );
      }
    });


    observerNormal.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}
















            function redirectToNative() {
            window.location.href = '/checkout';
            }


              // To set traffic source
                    // Function to check if trafficSource parameter is already set
                    function isTrafficSourceSet() {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.has("trafficSource");
                    }


                    // Function to get the referrer
                    function getReferrer() {
                    return document.referrer;
                    }


                    function getTrafficSource() {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.get("trafficSource");
                    }
                    // Function to capture and process the referrer URL
                    function processReferrer() {
                    const referrer = getReferrer();
                    let hostname = "";
                    try {
                      hostname = new URL(referrer).hostname;
                    } catch (error) {
                      console.error("Invalid referrer URL:", error, referrer);
                    }
                    return hostname;
                    }
                    // Function to set Parameters to the URL
                    function setParams(name) {
                    const urlParams = new URLSearchParams(window.location.search);
                    urlParams.set("trafficSource", name);
                    return urlParams;
                    }


                    // Function to set the trafficSource parameter
                    function setTrafficSource() {
                    // Check if trafficSource parameter is already set
                    if (isTrafficSourceSet()) {
                      return;
                    }
                    const referrerHostname = processReferrer();
                    const currentDomain = window.location.hostname;
                    // Check if the referrer hostname and current domain are different
                    if (referrerHostname !== currentDomain) {
                      const urlParams = setParams(referrerHostname);
                      const newUrl = window.location.pathname + "?" + urlParams.toString();
                      window.history.replaceState({}, "", newUrl);
                      return;
                    }
                    // if came from shopify, so we need to extract the referrer from query params
                    const referrerName = getReferrer();
                    const urlParams = new URL(referrerName);
                    const trafficSourceValue = urlParams.searchParams.get("trafficSource");
                    if (!trafficSourceValue) {
                      return;
                    }
                    // If trafficSource is set in referrer URL, update current URL with the same trafficSource value
                    const currentUrlParams = setParams(trafficSourceValue);
                    const newUrl = window.location.pathname + "?" + currentUrlParams.toString();
                    window.history.replaceState({}, "", newUrl);
                    }




            /* ===========================================================
              ???? DOM WATCHER
              =========================================================== */
            function claimRedirectAndWatch() {
              const observer = new MutationObserver(() => {
                hookAddToCart();
                hookBuyItNow();
                hookCartPageCheckout();
                hookUpcartCheckout();
                hookOCUCartCheckout();
                hookMuCheckoutButton();
              });
              observer.observe(document.body, { childList: true, subtree: true });
              hookAddToCart();
              hookBuyItNow();
              hookCartPageCheckout();
              hookUpcartCheckout();
              hookOCUCartCheckout();
              hookMuCheckoutButton();
            }
            /* ===========================================================
              ???? INIT
              =========================================================== */
            document.addEventListener('DOMContentLoaded', () => {
              claimRedirectAndWatch();
            });
</script>
