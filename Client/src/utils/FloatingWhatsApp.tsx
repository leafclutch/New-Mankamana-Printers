'use client'

import { motion } from "framer-motion"
import { RiWhatsappFill } from "react-icons/ri"
import { ADMIN_PHONE } from "./whatsapp"

const getWhatsAppUrl = () =>
  `https://wa.me/${ADMIN_PHONE}`

export default function FloatingWhatsApp() {

  const handleClick = () => {
    window.open(getWhatsAppUrl(), "_blank")
  }

  return (
    <div
      onClick={handleClick}
      className="fixed bottom-10 right-8 z-[1000] cursor-pointer flex items-center justify-center"
      aria-label="Contact us on WhatsApp"
    >

      {/* ripple ring */}
      <span className="absolute w-16 h-16 rounded-full bg-green-500/30 animate-ping" />

      {/* second ripple */}
      <span className="absolute w-20 h-20 rounded-full bg-green-500/20 animate-[ping_2.5s_infinite]" />

      {/* whatsapp button */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
        className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 shadow-lg"
      >
        <RiWhatsappFill className="text-white text-3xl" />
      </motion.div>

    </div>
  )
}