// src/services/scanService.js

import { verifyCertificate } from '../utils/verifyCertificate';
import { verifyDate } from '../utils/verifyDate';
import { verifyState } from '../utils/verifyState';
import { verifyOfLigneTicket } from '../utils/verifyOfLigneTicket';
import { addTransaction } from './transactionService';

export const handleScanResult = async (
  data,
  setResult,
  setScanned,
  setTicketStatus,
  setStatusColor,
  source
) => {
  try {
        console.log("data",data)
        console.log("source",source)


    const rawValue = data.value?.trim() || data

    if (!rawValue) {
      console.log("Empty scan result");
      return;
    }

    console.log("Scanned value:", rawValue);
    setResult(rawValue);
    setScanned(true);

    // ✅ parse JSON safely
    let ticketData = {};
    try {
      ticketData = JSON.parse(rawValue);
    } catch (e) {
      ticketData = { ticket_number: rawValue };
    }
    ticketData.uuid = ticketData.uuid || ticketData.device_uuid;


    const tr = {
      ticket_num: ticketData.ticket_number,
      ...ticketData
    };

    // 1️⃣ Certificate
    const resultCertificate = await verifyCertificate(tr);
    if (resultCertificate === "0") {
      const transaction = await addTransaction(tr, 'rejected', 'online',
        setTicketStatus, setStatusColor, setScanned);

      if (transaction === "0") return;

      setTicketStatus('invalid');
      setStatusColor('red');
      resetUI(setScanned, setTicketStatus, setStatusColor);
      return;
    }

    // 2️⃣ Date
    const resultDate = await verifyDate(tr);
    if (resultDate === "0") {
      const transaction = await addTransaction(tr, 'expired', 'online',
        setTicketStatus, setStatusColor, setScanned);

      if (transaction === "0") return;

      setTicketStatus('invalid');
      setStatusColor('red');
      resetUI(setScanned, setTicketStatus, setStatusColor);
      return;
    }

    // 3️⃣ State
    const resultState = await verifyState(tr,source);

    if (resultState === "0") {
      const resultOfLigneTicket = await verifyOfLigneTicket(tr);

      if (resultOfLigneTicket === "1") {
        const transaction = await addTransaction(tr, 'success', 'offline',
          setTicketStatus, setStatusColor, setScanned);

        if (transaction === "0") return;

        setTicketStatus('valid');
        setStatusColor('green');
        resetUI(setScanned, setTicketStatus, setStatusColor);
        return;
      } else {
        const transaction = await addTransaction(tr, 'invalid', 'online',
          setTicketStatus, setStatusColor, setScanned);

        if (transaction === "0") return;

        setTicketStatus('invalid');
        setStatusColor('red');
        resetUI(setScanned, setTicketStatus, setStatusColor);
        return;
      }
    }
    if (resultState === "2") {
      const transaction = await addTransaction(tr, 'invalid', 'online',
          setTicketStatus, setStatusColor, setScanned);

        if (transaction === "0") return;

        setTicketStatus('invalid');
        setStatusColor('red');
        resetUI(setScanned, setTicketStatus, setStatusColor);
        return;

    }

    // ✅ valid ticket
    const transaction = await addTransaction(tr, 'success', 'online',
      setTicketStatus, setStatusColor, setScanned);

    if (transaction === "0") return;

    setTicketStatus('valid');
    setStatusColor('green');
    resetUI(setScanned, setTicketStatus, setStatusColor);

  } catch (error) {
    console.error("Scan handling error:", error);
  }
};


// 🔁 helper لإعادة الحالة
const resetUI = (setScanned, setTicketStatus, setStatusColor) => {
  setTimeout(() => {
    setScanned(false);
    setTicketStatus(null);
    setStatusColor('transparent');
  }, 3000);
};