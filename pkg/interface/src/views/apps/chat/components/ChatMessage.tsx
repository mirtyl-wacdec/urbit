/* eslint-disable max-lines-per-function */
import React, {
  useState,
  useEffect,
  useRef,
  Component,
  PureComponent
} from 'react';
import moment from 'moment';
import _ from 'lodash';
import { Box, Row, Text, Rule, BaseImage } from '@tlon/indigo-react';
import { Sigil } from '~/logic/lib/sigil';
import OverlaySigil from '~/views/components/OverlaySigil';
import {
  uxToHex,
  cite,
  writeText,
  useShowNickname,
  useHovering
} from '~/logic/lib/util';
import {
  Group,
  Association,
  Contacts,
  Post,
  Groups,
  Associations
} from '~/types';
import TextContent from './content/text';
import CodeContent from './content/code';
import RemoteContent from '~/views/components/RemoteContent';
import { Mention } from '~/views/components/MentionText';
import styled from 'styled-components';
import useLocalState from '~/logic/state/local';

export const DATESTAMP_FORMAT = '[~]YYYY.M.D';

export const UnreadMarker = React.forwardRef(({ dayBreak, when }, ref) => {
  return (
    <Row
      height={'32px'}
      display='flex'
      flexShrink={0}
      ref={ref}
      color='blue'
      alignItems='center'
      fontSize='0'
      width='100%'
    >
      <Rule borderColor='blue' display={['none', 'block']} m='0' width='2rem' />
      <Text flexShrink='0' display='block' zIndex='2' mx='4' color='blue'>
        New messages below
      </Text>
      <Rule borderColor='blue' flexGrow='1' m='0' />
      <Rule style={{ width: 'calc(50% - 48px)' }} borderColor='blue' m='0' />
    </Row>
  );
});

export const DayBreak = ({ when }) => (
  <Row>
    <Text gray>
      {moment(when).calendar(null, { sameElse: DATESTAMP_FORMAT })}
    </Text>
  </Row>
);

interface ChatMessageProps {
  measure(element): void;
  msg: Post;
  previousMsg?: Post;
  nextMsg?: Post;
  isLastRead: boolean;
  group: Group;
  association: Association;
  contacts: Contacts;
  className?: string;
  isPending: boolean;
  style?: any;
  scrollWindow: HTMLDivElement;
  isLastMessage?: boolean;
  unreadMarkerRef: React.RefObject<HTMLDivElement>;
  history: any;
  api: any;
  highlighted?: boolean;
}

export default class ChatMessage extends Component<ChatMessageProps> {
  private divRef: React.RefObject<HTMLDivElement>;

  constructor(props) {
    super(props);
    this.divRef = React.createRef();
  }

  componentDidMount() {
    if (this.divRef.current) {
      this.props.measure(this.divRef.current);
    }
  }

  render() {
    const {
      msg,
      previousMsg,
      nextMsg,
      isLastRead,
      group,
      association,
      contacts,
      className = '',
      isPending,
      style,
      measure,
      scrollWindow,
      isLastMessage,
      unreadMarkerRef,
      history,
      api,
      highlighted,
      fontSize,
      groups,
      associations
    } = this.props;

    const renderSigil = Boolean(
      (nextMsg && msg.author !== nextMsg.author) || !nextMsg || msg.number === 1
    );
    const dayBreak =
      nextMsg &&
      new Date(msg['time-sent']).getDate() !==
        new Date(nextMsg['time-sent']).getDate();

    const containerClass = `${renderSigil ? '' : ''} ${
      isPending ? 'o-40' : ''
    } ${className}`;

    const timestamp = moment
      .unix(msg['time-sent'] / 1000)
      .format(renderSigil ? 'h:mm A' : 'h:mm');

    const reboundMeasure = (event) => {
      return measure(this.divRef.current);
    };

    const messageProps = {
      msg,
      timestamp,
      contacts,
      association,
      group,
      measure: reboundMeasure.bind(this),
      style,
      containerClass,
      isPending,
      history,
      api,
      scrollWindow,
      highlighted,
      fontSize,
      associations,
      groups
    };

    const unreadContainerStyle = {
      // height: isLastRead ? '2rem' : '0'
    };

    return (
      <Box ref={this.divRef} className={containerClass} style={style}>
        {dayBreak && !isLastRead ? <DayBreak when={msg['time-sent']} /> : null}
        {renderSigil ? (
          <MessageWithSigil {...messageProps} />
        ) : (
          <MessageWithoutSigil {...messageProps} />
        )}
        <Box style={unreadContainerStyle}>
          {isLastRead ? (
            <UnreadMarker
              dayBreak={dayBreak}
              when={msg['time-sent']}
              ref={unreadMarkerRef}
            />
          ) : null}
        </Box>
      </Box>
    );
  }
}

interface MessageProps {
  msg: Post;
  timestamp: string;
  group: Group;
  association: Association;
  contacts: Contacts;
  containerClass: string;
  isPending: boolean;
  style: any;
  measure(element): void;
  scrollWindow: HTMLDivElement;
  associations: Associations;
  groups: Groups;
}

export const MessageWithSigil = (props) => {
  const {
    msg,
    timestamp,
    contacts,
    association,
    associations,
    groups,
    group,
    measure,
    api,
    history,
    scrollWindow,
    fontSize
  } = props;

  const dark = useLocalState((state) => state.dark);

  const datestamp = moment
    .unix(msg['time-sent'] / 1000)
    .format(DATESTAMP_FORMAT);
  const contact =
    `~${msg.author}` in contacts ? contacts[`~${msg.author}`] : false;
  const showNickname = useShowNickname(contact);
  const shipName = showNickname ? contact.nickname : cite(msg.author);
  const copyNotice = 'Copied';
  const color = contact
    ? `#${uxToHex(contact.color)}`
    : dark
    ? '#000000'
    : '#FFFFFF';
  const sigilClass = contact
    ? ''
    : dark
    ? 'mix-blend-diff'
    : 'mix-blend-darken';
  const [displayName, setDisplayName] = useState(shipName);
  const [nameMono, setNameMono] = useState(showNickname ? false : true);
  const { hovering, bind } = useHovering();
  const [showOverlay, setShowOverlay] = useState(false);

  const toggleOverlay = () => {
    setShowOverlay((value) => !value);
  };

  const showCopyNotice = () => {
    setDisplayName(copyNotice);
    setNameMono(false);
  };

  useEffect(() => {
    const resetDisplay = () => {
      setDisplayName(shipName);
      setNameMono(showNickname ? false : true);
    };
    const timer = setTimeout(() => resetDisplay(), 800);
    return () => clearTimeout(timer);
  }, [displayName]);

  const img =
    contact && contact.avatar !== null ? (
      <BaseImage
        display='inline-block'
        src={contact.avatar}
        height={16}
        width={16}
      />
    ) : (
      <Sigil
        ship={msg.author}
        size={16}
        color={color}
        classes={sigilClass}
        icon
        padding={2}
      />
    );

  return (
    <Box mt={2} pt={2} py={1}>
      <Box mb={2} px={2} display={'flex'} alignItems={'center'}>
        <Box
          cursor={'pointer'}
          onClick={() => toggleOverlay()}
          height={16}
          mr={2}
        >
          {showOverlay && (
            <OverlaySigil
              ship={msg.author}
              contact={contact}
              color={`#${uxToHex(contact?.color ?? '0x0')}`}
              group={group}
              onDismiss={() => toggleOverlay()}
              history={history}
              className='relative'
              scrollWindow={scrollWindow}
            />
          )}
          {img}
        </Box>
        <Text
          mr={2}
          mono={nameMono}
          fontSize={1}
          fontWeight={nameMono ? '400' : '500'}
          lineHeight={'16px'}
          cursor={'pointer'}
          onClick={() => {
            writeText(`~${msg.author}`);
            showCopyNotice();
          }}
          title={`~${msg.author}`}
        >
          {displayName}
        </Text>
        <Text gray fontSize={1} lineHeight={'16px'}>
          {timestamp}
        </Text>
        {/* <Text gray mono>
          {datestamp}
        </Text> */}
      </Box>
      <Box pl={5}>
        {msg.contents.map((c, i) => (
          <MessageContent
            key={i}
            contacts={contacts}
            content={c}
            measure={measure}
            scrollWindow={scrollWindow}
            fontSize={fontSize}
            group={group}
            api={api}
            associations={associations}
            groups={groups}
          />
        ))}
      </Box>
    </Box>
  );
};

export const MessageWithoutSigil = ({
  timestamp,
  contacts,
  msg,
  measure,
  group,
  api,
  associations,
  groups,
  scrollWindow
}) => {
  const { hovering, bind } = useHovering();
  return (
    <Box display={'flex'} alignItems={'baseline'} py={1}>
      <Box
        flexBasis={'32px'}
        flexGrow={'0'}
        flexShrink={'0'}
        textAlign={'center'}
      >
        <Text gray fontSize={0} display={hovering ? 'inline' : 'none'}>
          {timestamp}
        </Text>
      </Box>
      <Box flexGrow={1} {...bind}>
        {msg.contents.map((c, i) => (
          <MessageContent
            key={i}
            contacts={contacts}
            content={c}
            group={group}
            measure={measure}
            scrollWindow={scrollWindow}
            groups={groups}
            associations={associations}
            api={api}
          />
        ))}
      </Box>
    </Box>
  );
};

export const MessageContent = ({
  content,
  contacts,
  api,
  associations,
  groups,
  measure,
  scrollWindow,
  fontSize,
  group
}) => {
  if ('code' in content) {
    return <CodeContent content={content} />;
  } else if ('url' in content) {
    return (
      <Box
        flexShrink={0}
        fontSize={fontSize ? fontSize : '14px'}
        lineHeight={'20px'}
        color='black'
      >
        <RemoteContent
          url={content.url}
          onLoad={measure}
          imageProps={{
            style: {
              maxWidth: 'min(100%,18rem)',
              display: 'block'
            }
          }}
          videoProps={{
            style: {
              maxWidth: '18rem',
              display: 'block'
            }
          }}
          textProps={{
            style: {
              fontSize: 'inherit',
              borderBottom: '1px solid',
              textDecoration: 'none'
            }
          }}
        />
      </Box>
    );
  } else if ('text' in content) {
    return (
      <TextContent
        associations={associations}
        groups={groups}
        measure={measure}
        api={api}
        fontSize={fontSize}
        lineHeight={'20px'}
        content={content}
      />
    );
  } else if ('mention' in content) {
    return (
      <Mention
        group={group}
        scrollWindow={scrollWindow}
        ship={content.mention}
        contact={contacts?.[content.mention]}
      />
    );
  } else {
    return null;
  }
};

export const MessagePlaceholder = ({
  height,
  index,
  className = '',
  style = {},
  ...props
}) => (
  <Box
    width='100%'
    fontSize='2'
    pl='3'
    pt='4'
    pr='3'
    display='flex'
    lineHeight='tall'
    className={className}
    style={{ height, ...style }}
    {...props}
  >
    <Box
      pr='3'
      verticalAlign='top'
      backgroundColor='white'
      style={{ float: 'left' }}
    >
      <Text
        display='block'
        background='gray'
        width='24px'
        height='24px'
        borderRadius='50%'
        style={{
          visibility: index % 5 == 0 ? 'initial' : 'hidden'
        }}
      ></Text>
    </Box>
    <Box
      style={{ float: 'right', flexGrow: 1 }}
      color='black'
      className='clamp-message'
    >
      <Box
        className='hide-child'
        paddingTop='4'
        style={{ visibility: index % 5 == 0 ? 'initial' : 'hidden' }}
      >
        <Text
          display='inline-block'
          verticalAlign='middle'
          fontSize='0'
          gray
          cursor='default'
        >
          <Text maxWidth='32rem' display='block'>
            <Text
              backgroundColor='gray'
              display='block'
              width='100%'
              height='100%'
            ></Text>
          </Text>
        </Text>
        <Text
          display='inline-block'
          mono
          verticalAlign='middle'
          fontSize='0'
          gray
        >
          <Text
            background='gray'
            display='block'
            height='1em'
            style={{ width: `${((index % 3) + 1) * 3}em` }}
          ></Text>
        </Text>
        <Text
          mono
          verticalAlign='middle'
          fontSize='0'
          ml='2'
          gray
          display={['none', 'inline-block']}
          className='child'
        >
          <Text
            backgroundColor='gray'
            display='block'
            width='100%'
            height='100%'
          ></Text>
        </Text>
      </Box>
      <Text
        display='block'
        backgroundColor='gray'
        height='1em'
        style={{ width: `${(index % 5) * 20}%` }}
      ></Text>
    </Box>
  </Box>
);
