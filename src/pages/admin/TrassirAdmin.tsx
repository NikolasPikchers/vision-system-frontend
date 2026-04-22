import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getChannels, addChannels, type TrassirConnectRequest, type TrassirAddChannel } from '@/api/trassir';
import type { TrassirChannel } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ChannelConfig {
  name: string;
  fps_limit: number;
  zone_check: boolean;
  ppe_check: boolean;
  timeout: number;
}

function defaultConfig(channel: TrassirChannel): ChannelConfig {
  return { name: channel.name, fps_limit: 5, zone_check: false, ppe_check: false, timeout: 60 };
}

export function TrassirAdmin() {
  const [conn, setConn] = useState<TrassirConnectRequest>({ ip: '', port: 80, username: '', password: '' });
  const [channels, setChannels] = useState<TrassirChannel[]>([]);
  const [selected, setSelected] = useState<Map<number, ChannelConfig>>(new Map());

  const connect = useMutation({
    mutationFn: () => getChannels(conn),
    onSuccess: (data) => {
      setChannels(data.channels);
      setSelected(new Map());
    },
    onError: () => toast.error('Не удалось подключиться к NVR'),
  });

  const add = useMutation({
    mutationFn: async () => {
      const payload: TrassirAddChannel[] = Array.from(selected.entries()).map(([id, cfg]) => {
        const ch = channels.find((c) => c.id === id);
        if (!ch) throw new Error('channel not found');
        return {
          id,
          name: cfg.name,
          stream_url_sub: ch.stream_url_sub,
          fps_limit: cfg.fps_limit,
          zone_check: cfg.zone_check,
          ppe_check: cfg.ppe_check,
          timeout: cfg.timeout,
        };
      });
      return addChannels(payload);
    },
    onSuccess: (res) => {
      toast.success(`Добавлено каналов: ${res.added_count}`);
      setSelected(new Map());
    },
    onError: () => toast.error('Не удалось добавить каналы'),
  });

  function toggleSelected(ch: TrassirChannel) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(ch.id)) next.delete(ch.id);
      else next.set(ch.id, defaultConfig(ch));
      return next;
    });
  }

  function updateConfig(id: number, patch: Partial<ChannelConfig>) {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (cur) next.set(id, { ...cur, ...patch });
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Подключение к Trassir NVR</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nvr-ip">IP-адрес</Label>
            <Input id="nvr-ip" value={conn.ip} onChange={(e) => setConn({ ...conn, ip: e.target.value })} placeholder="192.168.1.100" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nvr-port">Порт</Label>
            <Input id="nvr-port" type="number" value={conn.port} onChange={(e) => setConn({ ...conn, port: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nvr-user">Логин</Label>
            <Input id="nvr-user" value={conn.username} onChange={(e) => setConn({ ...conn, username: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nvr-pass">Пароль</Label>
            <Input id="nvr-pass" type="password" value={conn.password} onChange={(e) => setConn({ ...conn, password: e.target.value })} />
          </div>
        </div>
        <Button onClick={() => connect.mutate()} disabled={connect.isPending} className="self-start">
          {connect.isPending ? 'Подключение…' : 'Подключиться'}
        </Button>
      </Card>

      {channels.length > 0 && (
        <Card className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Каналы ({channels.length})</h2>
            <Button onClick={() => add.mutate()} disabled={selected.size === 0 || add.isPending}>
              {add.isPending ? 'Добавление…' : `Добавить выбранные (${selected.size})`}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map((ch) => {
              const isSelected = selected.has(ch.id);
              const cfg = selected.get(ch.id);
              return (
                <Card key={ch.id} className="p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`ch-${ch.id}`} checked={isSelected} onCheckedChange={() => toggleSelected(ch)} />
                    <Label htmlFor={`ch-${ch.id}`} className="flex-1 font-medium">{ch.name}</Label>
                    {ch.online ? (
                      <Badge variant="outline" className="text-success border-success/30">Online</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Offline</Badge>
                    )}
                  </div>
                  <div className="aspect-video overflow-hidden rounded-md bg-muted">
                    {ch.thumbnail_url && (
                      <img src={ch.thumbnail_url} alt={ch.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  {isSelected && cfg && (
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`ch-${ch.id}-name`}>Название в системе</Label>
                        <Input id={`ch-${ch.id}-name`} value={cfg.name} onChange={(e) => updateConfig(ch.id, { name: e.target.value })} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <Label htmlFor={`ch-${ch.id}-fps`}>FPS</Label>
                          <Input id={`ch-${ch.id}-fps`} type="number" value={cfg.fps_limit} onChange={(e) => updateConfig(ch.id, { fps_limit: Number(e.target.value) })} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <Label htmlFor={`ch-${ch.id}-timeout`}>Таймаут</Label>
                          <Input id={`ch-${ch.id}-timeout`} type="number" value={cfg.timeout} onChange={(e) => updateConfig(ch.id, { timeout: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`ch-${ch.id}-zone`}>Контроль зоны</Label>
                        <Switch id={`ch-${ch.id}-zone`} checked={cfg.zone_check} onCheckedChange={(v) => updateConfig(ch.id, { zone_check: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`ch-${ch.id}-ppe`}>Контроль спецодежды</Label>
                        <Switch id={`ch-${ch.id}-ppe`} checked={cfg.ppe_check} onCheckedChange={(v) => updateConfig(ch.id, { ppe_check: v })} />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
