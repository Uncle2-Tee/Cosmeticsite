"use client";

import { useEffect, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";

function CloseIcon() {
  return <CloseRoundedIcon sx={{ fontSize: 21 }} aria-hidden="true" focusable="false" />;
}

function BagIcon() {
  return <ShoppingBagIcon sx={{ fontSize: 19 }} aria-hidden="true" focusable="false" />;
}

export default function MobileMenu({ isOpen, onClose, onNavigate, onOpenCart, cartCount }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const existingOverflow = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = existingOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigate = (view) => { onClose(); onNavigate(view); };
  const openCart = () => { onClose(); onOpenCart(); };

  return <>
    <button className="mobile-menu-backdrop" onClick={onClose} aria-label="Close navigation" />
    <aside className="mobile-menu" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <div className="mobile-menu-top"><span className="mobile-menu-label">Navigation</span><button ref={closeButtonRef} onClick={onClose} aria-label="Close navigation"><CloseIcon /></button></div>
      <button className="mobile-menu-brand brand-mark" aria-label="Doresther Tradings home" onClick={() => navigate("home")}><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></button>
      <nav aria-label="Mobile navigation">
        <button onClick={() => navigate("home")}>Home <span>00</span></button>
        <button onClick={() => navigate("shop")}>Shop <span>01</span></button>
        <button onClick={() => navigate("about")}>About <span>02</span></button>
        <button onClick={() => navigate("journal")}>Journal <span>03</span></button>
        <button onClick={() => navigate("account")}>Account <span>04</span></button>
      </nav>
      <div className="mobile-menu-bottom">
        <p>Intentional essentials, made for your everyday.</p>
        <button className="mobile-bag-link" onClick={openCart}><span><BagIcon /> Your cart</span><b>{cartCount}</b></button>
        <small>Complimentary shipping on orders over GH₵60</small>
      </div>
    </aside>
  </>;
}
