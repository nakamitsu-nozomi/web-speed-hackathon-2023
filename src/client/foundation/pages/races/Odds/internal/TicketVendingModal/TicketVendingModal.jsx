import React, { forwardRef, useCallback, useState } from "react";
import styled from "styled-components";

import { EntryCombination } from "../../../../../components/displays/EntryCombination";
import { Dialog } from "../../../../../components/layouts/Dialog";
import { Spacer } from "../../../../../components/layouts/Spacer";
import { Stack } from "../../../../../components/layouts/Stack";
import { Heading } from "../../../../../components/typographies/Heading";
import { useAuth, useRegister } from "../../../../../contexts/AuthContext";
import { useMutation } from "../../../../../hooks/useMutation";
import { Color, Space } from "../../../../../styles/variables";

const CANCEL = "cancel";
const BUY = "buy";

const ErrorText = styled.p`
  color: ${Color.red};
`;

/**
 * @typedef Props
 * @type {object}
 * @property {string} raceId
 * @property {number[]} odds
 */

export const TicketVendingModal = forwardRef(({ odds, raceId }, ref) => {
  const { loggedIn } = useAuth();
  const [buyTicket, buyTicketResult] = useMutation(
    `/api/races/${raceId}/betting-tickets`,
    {
      auth: true,
      method: "POST",
    },
  );
  const { user: userData } = useAuth();
  const { update } = useRegister();
  const [error, setError] = useState(null);

  const handleCloseDialog = useCallback(
    async (e) => {
      try {
        setError("");
        if (e.currentTarget.returnValue === CANCEL) {
          return;
        }
        await buyTicket({
          key: odds,
          type: "trifecta",
        });
        const err = buyTicketResult.error;
        if (err === null) {
          await update();
          return;
        }
        if (!ref.current.hasAttribute("open")) {
          ref.current.showModal();
        }
        if (err.response?.status === 412) {
          setError("残高が不足しています");
          return;
        }
        setError(err.message);
      } catch (err) {
        console.error(err);
      }
    },
    [odds, buyTicket, ref, buyTicketResult.error],
  );

  const shouldShowForm = loggedIn && !!userData && odds !== null;

  return (
    <Dialog ref={ref} onClose={handleCloseDialog}>
      <Heading as="h1">拳券の購入</Heading>

      <Spacer mt={Space * 2} />

      <form method="dialog">
        <Stack gap={Space}>
          {!shouldShowForm ? (
            <>
              <ErrorText>購入するにはログインしてください</ErrorText>
              <menu>
                <button value={CANCEL}>閉じる</button>
              </menu>
            </>
          ) : (
            <>
              <div>
                <Stack horizontal>
                  購入する買い目: <EntryCombination numbers={odds} />
                </Stack>
              </div>
              <div>使用ポイント: 100pt</div>
              <div>所持しているポイント: {userData.balance}pt</div>
              <div>購入後に残るポイント: {userData.balance - 100}pt</div>
              {error && <ErrorText>{error}</ErrorText>}
              <menu>
                <button value={CANCEL}>キャンセル</button>
                <button value={BUY}>購入する</button>
              </menu>
            </>
          )}
        </Stack>
      </form>
    </Dialog>
  );
});

TicketVendingModal.displayName = "TicketVendingModal";
