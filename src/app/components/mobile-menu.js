"use client";

import { useEffect, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

function CloseIcon() {
  return <CloseRoundedIcon sx={{ fontSize: 21 }} aria-hidden="true" focusable="false" />;
}

function BagIcon() {
  return <ShoppingBagIcon sx={{ fontSize: 19 }} aria-hidden="true" focusable="false" />;
}

function MenuLink({ icon: Icon, children }) {
  return <span className="mobile-menu-link"><Icon sx={{ fontSize: 20 }} aria-hidden="true" focusable="false" /><span>{children}</span></span>;
}

export default function MobileMenu({ isOpen, onClose, onNavigate, cartCount }) {
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

  return <>
    <button className="mobile-menu-backdrop" onClick={onClose} aria-label="Close navigation" />
    <aside className="mobile-menu" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <div className="mobile-menu-top"><div className="mobile-menu-brand brand-mark" aria-label="Doresther Tradings"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></div><button ref={closeButtonRef} onClick={onClose} aria-label="Close navigation"><CloseIcon /></button></div>
      <nav aria-label="Mobile navigation">
        <button onClick={() => navigate("home")}><MenuLink icon={HomeOutlinedIcon}>Home</MenuLink><span>00</span></button>
        <button onClick={() => navigate("shop")}><MenuLink icon={StorefrontOutlinedIcon}>Shop</MenuLink><span>01</span></button>
        <button onClick={() => navigate("about")}><MenuLink icon={InfoOutlinedIcon}>About</MenuLink><span>02</span></button>
        <button onClick={() => navigate("account")}><MenuLink icon={PersonOutlineOutlinedIcon}>Account</MenuLink><span>03</span></button>
      </nav>
      <div className="mobile-menu-bottom">
        <p>Intentional essentials, made for your everyday.</p>
        <div className="mobile-bag-link"><span><BagIcon /> Your cart</span><b>{cartCount}</b></div>
      </div>
    </aside>
  </>;
}
