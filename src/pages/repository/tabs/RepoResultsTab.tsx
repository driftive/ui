import React from "react";
import {Alert, Button, Card, Col, Empty, Row, Space, Statistic, Table, TableProps, Tag, Tooltip, Typography} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  WarningOutlined
} from "@ant-design/icons";
import {GitOrganization} from "../../../model/GitOrganization.ts";
import {GitRepository} from "../../../model/GitRepository.ts";
import useAxios from "../../../context/auth/axios.ts";
import {useQuery, keepPreviousData} from "@tanstack/react-query";
import {isOk} from "../../../utils/axios.ts";
import {dayjs} from "../../../utils/dayjs.ts";
import {AnalysisResultIcon} from "../../../components/AnalysisResultIcon/AnalysisResultIcon.tsx";
import {useNavigate} from "react-router";
import {colors} from "../../../theme/theme.ts";

export interface RepoResultsTabProps {
  organization: GitOrganization;
  repository: GitRepository;
}

interface RepoAnalysisResult {
  uuid: string;
  repository_id: number;
  total_projects: number;
  total_projects_drifted: number;
  total_projects_errored: number;
  total_projects_skipped: number;
  duration_millis: number;
  created_at: string;
}

interface RepositoryRunStats {
  total_runs: number;
  runs_with_drift: number;
  last_run_at: string | null;
  latest_run: RepoAnalysisResult | null;
}

const API_PAGE_SIZE = 25;

export const RepoResultsTab: React.FC<RepoResultsTabProps> = ({organization, repository}) => {

  const navigate = useNavigate();
  const axios = useAxios();
  const [currentPage, setCurrentPage] = React.useState(1);

  const repoAnalysisRuns = useQuery({
    queryKey: ["getRepoAnalysisResults", repository?.id, currentPage],
    enabled: (!!repository) && (repository.id !== undefined && repository.id !== null),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const apiPage = currentPage - 1;
      const response = await axios.get(`/v1/repo/${repository.id}/runs?page=${apiPage}`);
      if (!isOk(response)) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const repoStatsQuery = useQuery({
    queryKey: ["getRepoStats", repository?.id],
    enabled: (!!repository) && (repository.id !== undefined && repository.id !== null),
    queryFn: async () => {
      const response = await axios.get<RepositoryRunStats>(`/v1/repo/${repository.id}/stats`);
      if (!isOk(response)) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const columns: TableProps<RepoAnalysisResult>['columns'] = [
    {
      key: 'icon',
      title: undefined,
      dataIndex: 'total_projects_drifted',
      width: 50,
      render: (_, item) => {
        return (<AnalysisResultIcon item={item}/>);
      }
    },
    {
      key: 'projects',
      title: 'Projects',
      dataIndex: 'total_projects',
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, item) => {
        const hasDrift = item.total_projects_drifted > 0;
        const hasErrors = item.total_projects_errored > 0;
        const hasSkipped = item.total_projects_skipped > 0;

        if (!hasDrift && !hasErrors && !hasSkipped) {
          return <Tag icon={<CheckCircleOutlined />} color={colors.success}>OK</Tag>;
        }

        return (
          <Space size={4}>
            {hasErrors && (
              <Tag icon={<ExclamationCircleOutlined />} color={colors.error}>
                {item.total_projects_errored} errored
              </Tag>
            )}
            {hasDrift && (
              <Tag icon={<WarningOutlined />} color={colors.warning}>
                {item.total_projects_drifted} drifted
              </Tag>
            )}
            {hasSkipped && (
              <Tag icon={<PauseCircleOutlined />} color="blue">
                {item.total_projects_skipped} skipped
              </Tag>
            )}
          </Space>
        );
      }
    },
    {
      key: 'duration',
      title: 'Duration',
      dataIndex: 'duration_millis',
      render: (value) => {
        return (<Tooltip title={dayjs.duration({milliseconds: value}).asSeconds() + 's'}>
            {dayjs.duration({milliseconds: value}).humanize(false)}
          </Tooltip>
        );
      }
    },
    {
      key: 'date',
      title: 'Date',
      dataIndex: 'created_at',
      render: (value) => {
        let label: string;
        let showTooltip = false;
        if (dayjs(new Date()).diff(dayjs(value), 'h') > 10) {
          label = dayjs(value).format('lll')
        } else {
          label = dayjs(value).fromNow();
          showTooltip = true;
        }

        if (showTooltip) {
          return (
            <Tooltip title={dayjs(value).format('lll')}>
              {label}
            </Tooltip>
          )
        } else {
          return <div>{label}</div>
        }
      }
    }
  ];

  const isEmpty = !repoAnalysisRuns.isLoading && !repoAnalysisRuns.isError && repoAnalysisRuns.data?.length === 0;

  const stats = repoStatsQuery.data;

  const hasDrift = stats?.latest_run && stats.latest_run.total_projects_drifted > 0;

  return (
    <div style={{paddingTop: 16}}>
      {/* Summary Statistics */}
      {stats && !repoStatsQuery.isLoading && !repoStatsQuery.isError && stats.total_runs > 0 && (
        <Row gutter={[16, 16]} style={{marginBottom: 24}}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{borderRadius: 8, height: '100%'}}>
              <Statistic
                title={<span style={{fontSize: 12, color: colors.textSecondary}}>Total Runs</span>}
                value={stats.total_runs}
                prefix={<HistoryOutlined style={{color: colors.primary}} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{borderRadius: 8, height: '100%'}}>
              <Statistic
                title={<span style={{fontSize: 12, color: colors.textSecondary}}>Runs with Drift</span>}
                value={stats.runs_with_drift}
                valueStyle={{color: stats.runs_with_drift > 0 ? colors.error : colors.success}}
                prefix={<WarningOutlined style={{color: stats.runs_with_drift > 0 ? colors.error : colors.success}} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Tooltip title={stats.last_run_at ? dayjs(stats.last_run_at).format('lll') : ''}>
              <Card size="small" style={{borderRadius: 8, height: '100%'}}>
                <Statistic
                  title={<span style={{fontSize: 12, color: colors.textSecondary}}>Last Run</span>}
                  value={stats.last_run_at ? dayjs(stats.last_run_at).fromNow() : 'N/A'}
                  prefix={<ClockCircleOutlined style={{color: colors.primary}} />}
                />
              </Card>
            </Tooltip>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: 8,
                height: '100%',
                borderColor: hasDrift ? colors.error : colors.success,
                backgroundColor: hasDrift ? colors.errorBg : colors.successBg,
              }}
            >
              <Statistic
                title={<span style={{fontSize: 12, color: colors.textSecondary}}>Last Run Status</span>}
                value={hasDrift ? `${stats.latest_run?.total_projects_drifted} drifted` : 'No drift'}
                valueStyle={{color: hasDrift ? colors.error : colors.success}}
                prefix={hasDrift ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

        {repoAnalysisRuns.isError ? (
          <Alert
            title="Failed to load analysis results"
            description="We couldn't fetch the analysis results. Please try again."
            type="error"
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => repoAnalysisRuns.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : isEmpty ? (
          <Empty
            image={<RocketOutlined style={{fontSize: 48, color: '#bfbfbf'}} />}
            description={
              <Space orientation="vertical" size="small">
                <Typography.Text>No analysis results yet</Typography.Text>
                <Typography.Text type="secondary">
                  Run Driftive on your repository to see drift detection results here
                </Typography.Text>
              </Space>
            }
            style={{padding: '48px 0'}}
          />
        ) : (
          <Table size="small"
                 rowClassName="clickable-row"
                 onRow={(record) => {
                   return {
                     "onClick": () => {
                       navigate(`/gh/${organization.name}/${repository.name}/run/${record.uuid}`);
                     },
                     "onKeyDown": (e) => {
                       if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         navigate(`/gh/${organization.name}/${repository.name}/run/${record.uuid}`);
                       }
                     },
                     "style": {cursor: 'pointer'},
                     "tabIndex": 0,
                     "role": "button",
                     "aria-label": `View analysis run from ${dayjs(record.created_at).format('lll')}, ${record.total_projects_drifted} drifted projects`
                   }
                 }}
                 dataSource={repoAnalysisRuns.data}
                 rowKey="uuid"
                 columns={columns}
                 loading={repoAnalysisRuns.isLoading || repoAnalysisRuns.isFetching}
                 pagination={{
                   current: currentPage,
                   pageSize: API_PAGE_SIZE,
                   total: stats?.total_runs ?? 0,
                   showSizeChanger: false,
                   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`,
                   onChange: (page) => {
                     setCurrentPage(page);
                   },
                 }}
          />
        )}
    </div>
  );

}
