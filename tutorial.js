// Tutorial helper: highlight active TOC link while scrolling.
(() => {
  const links = [...document.querySelectorAll(".toc a")];
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  function onScroll(){
    const y = window.scrollY + 120;
    let active = sections[0];
    for (const s of sections){
      if (s.offsetTop <= y) active = s;
    }
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + active.id));
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
})();
