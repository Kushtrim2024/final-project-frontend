"use client";

import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faApplePay,
  faGooglePay,
  faPaypal,
  faXTwitter,
  faFacebookF,
  faInstagram,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-950 text-slate-200">
      {/* top grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand / Payment */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logow.png"
              alt="Liefrik"
              width={144}
              height={144}
              className="h-17 w-17 rounded-md object-contain"
            />
          </Link>
          <p className="mt-3 text-sm text-white/80">
            Fast delivery with a strong network of restaurants. Discover great
            food near you.
          </p>

          {/* payment icons */}
          <div className="mt-4 flex items-center gap-4 text-white ml-[-0.2rem] ">
            <Link
              href="https://www.paypal.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon
                icon={faPaypal}
                className="text-2xl hover:text-blue-400 transition"
              />
            </Link>
            <Link
              href="https://pay.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon
                icon={faGooglePay}
                className="text-4xl hover:text-green-400 transition"
              />
            </Link>
            <Link
              href="https://www.apple.com/apple-pay/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon
                icon={faApplePay}
                className="text-4xl hover:text-yellow-400 transition"
              />
            </Link>
          </div>
        </div>

        {/* Partner */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Partner with us
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/footerinfo/couriers"
                className="hover:text-yellow-400"
              >
                For couriers
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/merchants"
                className="hover:text-yellow-400"
              >
                For merchants
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/affiliates"
                className="hover:text-yellow-400"
              >
                For affiliates
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/contact"
                className="hover:text-yellow-400"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Company
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/footerinfo/about" className="hover:text-yellow-400">
                About us
              </Link>
            </li>
            <li>
              <Link href="/footerinfo/jobs" className="hover:text-yellow-400">
                Jobs
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/security"
                className="hover:text-yellow-400"
              >
                Security
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/sustainability"
                className="hover:text-yellow-400"
              >
                Sustainability
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/investors"
                className="hover:text-yellow-400"
              >
                Investors
              </Link>
            </li>
          </ul>
        </div>

        {/* Useful + Social */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Useful links
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/footerinfo/help" className="hover:text-yellow-400">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/footerinfo/terms" className="hover:text-yellow-400">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/privacy"
                className="hover:text-yellow-400"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/footerinfo/cookies"
                className="hover:text-yellow-400"
              >
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/footerinfo/cities" className="hover:text-yellow-400">
                All cities
              </Link>
            </li>
          </ul>

          {/* Social icons */}
          <div className="mt-6 flex items-center gap-4 ml-[-0.1rem]">
            <Link
              href="https://instagram.com"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <FontAwesomeIcon
                icon={faInstagram}
                className="text-xl hover:text-pink-500 transition"
              />
            </Link>
            <Link
              href="https://x.com"
              aria-label="X"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <FontAwesomeIcon
                icon={faXTwitter}
                className="text-xl hover:text-blue-400 transition"
              />
            </Link>
            <Link
              href="https://facebook.com"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <FontAwesomeIcon
                icon={faFacebookF}
                className="text-xl hover:text-blue-500 transition"
              />
            </Link>
            <Link
              href="https://linkedin.com"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <FontAwesomeIcon
                icon={faLinkedinIn}
                className="text-2xl hover:text-blue-600 transition"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto pr-10 flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Liefrik. All rights reserved.This is a
            student project. It has no commercial purpose.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/footerinfo/accessibility"
              className="hover:text-slate-200"
            >
              Accessibility
            </Link>
            <Link href="/footerinfo/imprint" className="hover:text-slate-200">
              Imprint
            </Link>
            <Link href="/footerinfo/privacy" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link href="/footerinfo/terms" className="hover:text-slate-200">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
