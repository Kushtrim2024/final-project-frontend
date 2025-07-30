"use client";
import React from "react";
import Link from "next/link";
import "../styles/footer.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset,
  faAt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

import {
  faGithub,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  console.log(typeof window === "undefined" ? "server" : "client");
  return (
    <footer className="bg-gray-800 text-white w-full">
      <div className="footer-container ">
        {/* Link Section */}
        <section className="col-span-3 grid grid-cols-3 gap-1 place-items-center m-0 p-0">
          <div className="card-box">
            <div className="flex row gap-2 items-center">
              <FontAwesomeIcon icon={faHeadset} className="h-5 w-5" />

              <h2 className="text-lg font-semibold">CUSTOMER SERVICE</h2>
            </div>
            <div>
              <hr className="my-2 border-gray-500" />
              <ul>
                <li>
                  <Link href="/footerinfo/contact">Contact Form</Link>{" "}
                </li>
                <li>
                  <Link href="/footerinfo/return">Shipping & Returns</Link>
                </li>
                <li>
                  <Link href="/footerinfo/faq">FAQ</Link>
                </li>
                <li>
                  <Link href="/footerinfo/newsletter">Newsletter</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="card-box">
            <div className="flex row gap-2 items-center">
              <FontAwesomeIcon icon={faHeadset} className="h-5 w-5" />
              <h2 className="text-lg font-semibold">INFORMATION</h2>
            </div>
            <div>
              <hr className="my-2 border-gray-500" />
              <ul>
                <li>
                  <Link href="/footerinfo/about">About Us</Link>
                </li>
                <li>
                  <Link href="/footerinfo/careers">Careers</Link>
                </li>
                <li>
                  <Link href="/footerinfo/rateUs">Rate Us</Link>
                </li>

                <li>
                  <Link href="/footerinfo/payment">Shipping and Payment</Link>
                </li>
                <li>
                  <Link href="/footerinfo/cookie">Cookie Settings</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="card-box">
            <div className="flex row gap-2 items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5" />
              <h2 className="text-lg font-semibold">LEGAL NOTICE</h2>
            </div>
            <div>
              <hr className="my-2 border-gray-500" />
              <ul>
                <li>
                  <Link href="/footerinfo/impressum">Imprint</Link>
                </li>
                <li>
                  <Link href="/footerinfo/policy">Privacy Policy</Link>
                </li>

                <li>
                  <Link href="/footerinfo/terms">Terms and Conditions</Link>
                </li>
              </ul>
            </div>
            <img src="/logo.png" alt="logo" className="footer-logo  " />
          </div>
        </section>

        {/* Social Section---------------------------------- */}
        <section className="col-span-1 flex flex-col items-center justify-between ">
          <div className="card-box2 ">
            <h2 className="text-lg font-semibold mb-2">FOLLOW US</h2>
            <div className="social-icons">
              <Link
                href="https://github.com/Kushtrim2024/final-project-frontend"
                target="_blank"
              >
                <FontAwesomeIcon icon={faGithub} className="h-5 w-5 pr-0.5" />
              </Link>
              <Link href="https://www.instagram.com/" target="_blank">
                <FontAwesomeIcon
                  icon={faInstagram}
                  className="h-5 w-5 pr-0.5"
                />
              </Link>
              <Link href="https://x.com/" target="_blank">
                <FontAwesomeIcon icon={faTwitter} className="h-5 w-5 pr-0.5" />
              </Link>
              <Link
                href="https://www.youtube.com/watch?v=OYCZNV38isg "
                target="_blank"
              >
                <FontAwesomeIcon icon={faYoutube} className="h-5 w-5 pr-0.5" />
              </Link>

              <Link href="https://www.linkedin.com/" target="_blank">
                <FontAwesomeIcon
                  icon={faLinkedin}
                  className="h-5 w-5 pr-0.5 mt-3"
                />
              </Link>
            </div>
            <div>
              <div className="info">
                <FontAwesomeIcon icon={faAt} className="h-5 w-5 pr-5 pt-1" />
                <Link href="/contact">info@liefrik.de</Link>
              </div>
            </div>

            {/*---Workin Hours-------------------------- */}
            <div className="absolute bottom-14 right-46 rotate-90 w-40 h-10 b text-center">
              <p>Working Hours</p>
            </div>
            <div className="workinghours">
              <p>Montag – Freitag </p>
              <p>09:00 – 18:00 Uhr</p>
              <p>Samstags </p>
              <p>09:00 – 12:00 Uhr</p>
            </div>
            {/*------------------------------------------------------- */}
          </div>
        </section>
      </div>
    </footer>
  );
}
