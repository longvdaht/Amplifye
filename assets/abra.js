// Badge Selling Plan Management
(() => {
  if (!window.location.pathname.includes('/products')) return;
  
  let isRendering = false;
  
  const init = () => {
    const subscriptionInput = document.querySelector('[data-selling-plan-option="subscription"] input[type="radio"]');
    const oneTimeInput = document.querySelector('[data-selling-plan-option="one-time"] input[type="radio"]');
    
    if (!subscriptionInput || !oneTimeInput) {
      setTimeout(init, 100);
      return;
    }
    
    const handleChange = () => {
      if (isRendering) return;
      isRendering = true;
      window.Abra.useSellingPlanPriceOnProductBlock = subscriptionInput.checked;
      window.Abra.render();
      setTimeout(() => { isRendering = false; }, 100);
    };
    
    subscriptionInput.removeEventListener('change', handleChange);
    oneTimeInput.removeEventListener('change', handleChange);
    subscriptionInput.addEventListener('change', handleChange);
    oneTimeInput.addEventListener('change', handleChange);
    
    if (!isRendering) handleChange();
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();