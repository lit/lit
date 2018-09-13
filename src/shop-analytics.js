class ShopAnalytics extends HTMLElement {
  connectedCallback() {
    // track metrics with google analytics...
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName('body')[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', this.getAttribute('key'), 'auto');
    ga('send', 'pageview');
  }
}
customElements.define('shop-analytics', ShopAnalytics);
