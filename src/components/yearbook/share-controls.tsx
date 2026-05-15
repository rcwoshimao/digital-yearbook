import { addInvite, revokeInvite, updateShareMode } from "@/app/dashboard/actions";
import type { YearbookInvite } from "@/lib/types/yearbook";

type ShareControlsProps = {
  appUrl: string;
  invites: YearbookInvite[];
  shareMode: "link" | "invite_only";
  yearbookId: string;
};

export function ShareControls({ appUrl, invites, shareMode, yearbookId }: ShareControlsProps) {
  const shareUrl = `${appUrl}/yearbook/${yearbookId}/write`;

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-yearbook-paper p-4">
      <div>
        <p className="text-sm font-semibold text-stone-700">Share link</p>
        <p className="mt-1 break-all font-mono text-xs text-stone-600">{shareUrl}</p>
      </div>
      <form action={updateShareMode} className="flex flex-wrap items-end gap-2">
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <label className="text-sm font-semibold text-stone-700">
          Share mode
          <select
            className="mt-1 block rounded-full border border-stone-300 bg-white px-3 py-2 text-sm"
            defaultValue={shareMode}
            name="shareMode"
          >
            <option value="link">Anyone with link</option>
            <option value="invite_only">Invite only</option>
          </select>
        </label>
        <button className="rounded-full bg-yearbook-ink px-4 py-2 text-sm font-semibold text-white">
          Save
        </button>
      </form>
      <form action={addInvite} className="flex flex-wrap items-end gap-2">
        <input name="yearbookId" type="hidden" value={yearbookId} />
        <label className="min-w-0 flex-1 text-sm font-semibold text-stone-700">
          Invite by user ID
          <input
            className="mt-1 w-full rounded-full border border-stone-300 px-3 py-2 text-sm"
            name="invitedUserId"
            placeholder="Supabase user UUID"
          />
        </label>
        <button className="rounded-full bg-yearbook-accent px-4 py-2 text-sm font-semibold text-white">
          Invite
        </button>
      </form>
      {invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-stone-700">Invited users</p>
          {invites.map((invite) => (
            <form
              action={revokeInvite}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
              key={invite.id}
            >
              <input name="yearbookId" type="hidden" value={yearbookId} />
              <input name="invitedUserId" type="hidden" value={invite.invitedUserId} />
              <span className="truncate font-mono text-xs">{invite.invitedUserId}</span>
              <button className="font-semibold text-red-700">Revoke</button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
