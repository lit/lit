export const shopButtonStyle = `
shop-button {
  display: inline-block;
}

shop-button > * {
  display: inline-block;
  box-sizing: border-box;
  border: 2px solid #000;
  background-color: #FFF;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-primary-color);
  margin: 0;
  padding: 8px 44px;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  border-radius: 0;
  outline: none;
  -webkit-appearance: none;
}

shop-button > *:focus {
  background-color: #c5cad3;
}

shop-button > *:active {
  background-color: #000;
  color: #FFF;
}

@media (max-width: 767px) {

  /* Responsive buttons are used in shop-detail, shop-cart and shop-checkout */
  shop-button[responsive] {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    height: 64px;
    z-index: 1;
  }

  shop-button[responsive] > * {
    background-color: var(--app-accent-color);
    border: none;
    color: white;
    padding: 20px;
    width: 100%;
    height: 100%;
    font-size: 15px;
  }

  shop-button[responsive] > *:focus {
    background-color: var(--app-accent-color);
  }

}`;
